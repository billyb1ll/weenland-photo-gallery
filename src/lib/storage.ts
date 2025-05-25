import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import path from "path";
import { generateDateBasedId, isDateBasedId } from "./id-generator";

// Initialize Google Cloud Storage
const initStorage = () => {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

	// Check if we have JSON credentials (for production) or file path (for development)
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
		// Production: Use JSON credentials from environment variable
		const credentials = JSON.parse(
			process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
		);
		return new Storage({
			projectId,
			credentials,
		});
	} else {
		// Development: Use key file path
		return new Storage({
			projectId,
			keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
		});
	}
};

const storage = initStorage();

const bucketName =
	process.env.GOOGLE_CLOUD_BUCKET_NAME || "weenland-gallery-images-2025";
const bucket = storage.bucket(bucketName);

export interface UploadResult {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	category: string;
	tags: string[];
	day: number;
	uploadDate: string;
	gcsPath: string;
}

/**
 * Upload an image to Google Cloud Storage
 * @param imageBuffer - The image buffer
 * @param originalName - Original filename
 * @param day - Day number for organization
 * @param existingImages - Existing images to check for ID conflicts
 * @returns Upload result with URLs
 */
export async function uploadImageToGCS(
	imageBuffer: Buffer,
	originalName: string,
	day: number,
	existingImages: Array<{ id: number; uploadDate: string }> = []
): Promise<UploadResult> {
	try {
		// Generate date-based ID with gallery day number
		const newId = generateDateBasedId(existingImages, day);

		const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
		const extension = path.extname(cleanName) || ".jpg";
		const baseName = path.basename(cleanName, extension);

		// Create file paths using the new ID format
		const fullImagePath = `images/day-${day}/full/${newId}-${baseName}${extension}`;
		const thumbnailPath = `images/day-${day}/thumbnails/${newId}-${baseName}_thumb${extension}`;

		// Process images with Sharp
		// Keep original image without resizing, only optimize if it's not already optimized
		const fullImage = await sharp(imageBuffer)
			.jpeg({ quality: 100, progressive: true }) // Maximum quality, progressive loading
			.toBuffer();

		const thumbnail = await sharp(imageBuffer)
			.resize(400, 300, {
				fit: "cover",
			})
			.jpeg({ quality: 80 })
			.toBuffer();

		// Upload full image
		const fullImageFile = bucket.file(fullImagePath);
		await fullImageFile.save(fullImage, {
			metadata: {
				contentType: "image/jpeg",
				metadata: {
					originalName,
					day: day.toString(),
					uploadDate: new Date().toISOString(),
					quality: "original", // Mark as original quality
				},
			},
			public: true, // Make files publicly accessible
		});

		// Upload thumbnail
		const thumbnailFile = bucket.file(thumbnailPath);
		await thumbnailFile.save(thumbnail, {
			metadata: {
				contentType: "image/jpeg",
				metadata: {
					originalName,
					day: day.toString(),
					uploadDate: new Date().toISOString(),
					type: "thumbnail",
				},
			},
			public: true,
		});

		// Generate public URLs
		const fullUrl = `https://storage.googleapis.com/${bucketName}/${fullImagePath}`;
		const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${thumbnailPath}`;

		return {
			id: newId,
			thumbnailUrl,
			fullUrl,
			title: baseName,
			category: "uploaded",
			tags: [`day-${day}`, "uploaded"],
			day,
			uploadDate: new Date().toISOString(),
			gcsPath: fullImagePath,
		};
	} catch (error) {
		console.error("Error uploading to GCS:", error);
		throw new Error(
			`Failed to upload image: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * List all images from Google Cloud Storage
 */
export async function listImagesFromGCS(): Promise<UploadResult[]> {
	try {
		const [files] = await bucket.getFiles({
			prefix: "images/",
		});

		const images: UploadResult[] = [];

		// Filter only full images (not thumbnails)
		const fullImages = files.filter(
			(file) => file.name.includes("/full/") && !file.name.endsWith("/")
		);

		for (const file of fullImages) {
			try {
				const [metadata] = await file.getMetadata();
				const customMetadata = metadata.metadata || {};

				// Extract day from path
				const dayMatch = file.name.match(/day-(\d+)/);
				const day = dayMatch ? parseInt(dayMatch[1]) : 1;

				// Generate thumbnail path
				const thumbnailPath = file.name
					.replace("/full/", "/thumbnails/")
					.replace(/(\.[^.]+)$/, "_thumb$1");

				const fullUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
				const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${thumbnailPath}`;

				// Extract ID from filename - handle both timestamp and date-based IDs
				const idMatch = file.name.match(/(\d+)-/);
				let id: number;
				if (idMatch) {
					const extractedId = parseInt(idMatch[1]);
					// Check if it's a valid date-based ID (9 digits) or fallback to timestamp
					id = isDateBasedId(extractedId) ? extractedId : extractedId;
				} else {
					// Fallback to current timestamp if no ID found
					id = Date.now();
				}

				const title = String(
					customMetadata.originalName ||
						path
							.basename(file.name)
							.replace(/^\d+-/, "")
							.replace(/\.[^.]+$/, "")
				);

				images.push({
					id,
					thumbnailUrl,
					fullUrl,
					title,
					category: "uploaded",
					tags: [`day-${day}`, "uploaded"],
					day,
					uploadDate: String(
						customMetadata.uploadDate ||
							metadata.timeCreated ||
							new Date().toISOString()
					),
					gcsPath: file.name,
				});
			} catch (error) {
				console.error(`Error processing file ${file.name}:`, error);
				// Continue with other files
			}
		}

		// Sort by upload date (newest first)
		return images.sort(
			(a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
		);
	} catch (error) {
		console.error("Error listing images from GCS:", error);
		throw new Error(
			`Failed to list images: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Delete an image from Google Cloud Storage
 */
export async function deleteImageFromGCS(gcsPath: string): Promise<void> {
	// Delete full image
	try {
		await bucket.file(gcsPath).delete();
		console.log(`✅ Deleted file: ${gcsPath}`);
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === 404
		) {
			console.log(`⚠️ File not found (already deleted?): ${gcsPath}`);
		} else {
			console.warn(`Could not delete main file ${gcsPath}:`, error);
		}
	}

	// Delete corresponding thumbnail
	const thumbnailPath = gcsPath
		.replace("/full/", "/thumbnails/")
		.replace(/(\.[^.]+)$/, "_thumb$1");

	try {
		await bucket.file(thumbnailPath).delete();
		console.log(`✅ Deleted thumbnail: ${thumbnailPath}`);
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === 404
		) {
			console.log(`⚠️ Thumbnail not found (may not exist): ${thumbnailPath}`);
		} else {
			console.warn(`Could not delete thumbnail ${thumbnailPath}:`, error);
		}
	}
}

/**
 * Download an image buffer from Google Cloud Storage
 */
export async function downloadImageFromGCS(gcsPath: string): Promise<Buffer> {
	try {
		const file = bucket.file(gcsPath);
		const [buffer] = await file.download();
		return buffer;
	} catch (error) {
		console.error("Error downloading image from GCS:", error);
		throw new Error(
			`Failed to download image: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Check if Google Cloud Storage is properly configured
 */
export async function checkGCSConnection(): Promise<boolean> {
	try {
		await bucket.getMetadata();
		return true;
	} catch (error) {
		console.error("GCS connection failed:", error);
		return false;
	}
}
