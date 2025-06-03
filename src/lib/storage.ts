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
	day: number;
	uploadDate: string;
	gcsPath: string;
}

export interface ImageDataByFileName {
	filename: string;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	day: number;
	uploadDate: string;
	gcsPath: string;
	originalSize?: number;
	dimensions?: {
		width: number;
		height: number;
	};
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

		// Process images with Sharp to preserve maximum quality
		// Determine the best format to preserve quality
		const metadata = await sharp(imageBuffer).metadata();

		let fullImage: Buffer;
		let outputExtension: string;
		let contentType: string;

		if (metadata.format === "png" && metadata.hasAlpha) {
			// Preserve PNG with transparency at maximum quality
			fullImage = await sharp(imageBuffer)
				.png({ quality: 100, compressionLevel: 0 }) // No compression
				.toBuffer();
			outputExtension = ".png";
			contentType = "image/png";
		} else if (metadata.format === "webp") {
			// Preserve WebP at maximum quality
			fullImage = await sharp(imageBuffer)
				.webp({ quality: 100, lossless: true }) // Lossless WebP
				.toBuffer();
			outputExtension = ".webp";
			contentType = "image/webp";
		} else {
			// Convert to highest quality JPEG with minimal compression
			fullImage = await sharp(imageBuffer)
				.jpeg({ quality: 100, progressive: true, mozjpeg: true }) // Maximum quality
				.toBuffer();
			outputExtension = ".jpg";
			contentType = "image/jpeg";
		}

		// Create optimized thumbnail (can be compressed since it's just for display)
		const thumbnail = await sharp(imageBuffer)
			.resize(400, 300, {
				fit: "cover",
				withoutEnlargement: true, // Don't upscale small images
			})
			.jpeg({ quality: 85 })
			.toBuffer();

		// Create file paths using the determined extension
		const fullImagePath = `images/day-${day}/full/${newId}-${baseName}${outputExtension}`;
		const thumbnailPath = `images/day-${day}/thumbnails/${newId}-${baseName}_thumb.jpg`;

		// Upload full image
		const fullImageFile = bucket.file(fullImagePath);
		await fullImageFile.save(fullImage, {
			metadata: {
				contentType: contentType,
				metadata: {
					originalName,
					day: day.toString(),
					uploadDate: new Date().toISOString(),
					quality: "maximum", // Mark as maximum quality
					format: metadata.format || "unknown",
					originalSize: imageBuffer.length.toString(),
					processedSize: fullImage.length.toString(),
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
 * Upload an image to Google Cloud Storage using original filename
 * @param imageBuffer - The image buffer
 * @param originalName - Original filename (used as primary key)
 * @param day - Day number for organization
 * @returns Upload result with original filename as identifier
 */
export async function uploadOriginalImageToGCS(
	imageBuffer: Buffer,
	originalName: string,
	day: number
): Promise<ImageDataByFileName> {
	try {
		// Clean filename but preserve original name structure
		const cleanName = originalName.replace(/[<>:"/\\|?*]/g, "_");
		const extension = path.extname(cleanName).toLowerCase();
		const baseName = path.basename(cleanName, extension);

		// Process images with Sharp to preserve maximum quality
		const metadata = await sharp(imageBuffer).metadata();

		let fullImage: Buffer;
		let outputExtension: string;
		let contentType: string;

		if (metadata.format === "png" && metadata.hasAlpha) {
			// Preserve PNG with transparency at maximum quality
			fullImage = await sharp(imageBuffer)
				.png({ quality: 100, compressionLevel: 0 })
				.toBuffer();
			outputExtension = ".png";
			contentType = "image/png";
		} else if (metadata.format === "webp") {
			// Preserve WebP at maximum quality
			fullImage = await sharp(imageBuffer)
				.webp({ quality: 100, lossless: true })
				.toBuffer();
			outputExtension = ".webp";
			contentType = "image/webp";
		} else {
			// Convert to highest quality JPEG
			fullImage = await sharp(imageBuffer)
				.jpeg({ quality: 100, progressive: true, mozjpeg: true })
				.toBuffer();
			outputExtension = extension || ".jpg";
			contentType = "image/jpeg";
		}

		// Create optimized thumbnail
		const thumbnail = await sharp(imageBuffer)
			.resize(400, 300, {
				fit: "cover",
				withoutEnlargement: true,
			})
			.jpeg({ quality: 85 })
			.toBuffer();

		// Use original filename for paths, but ensure we have the right extension
		const finalFilename = extension ? cleanName : `${baseName}${outputExtension}`;
		const fullImagePath = `images/day-${day}/full/${finalFilename}`;
		const thumbnailPath = `images/day-${day}/thumbnails/${baseName}_thumb.jpg`;

		// Upload full image
		const fullImageFile = bucket.file(fullImagePath);
		await fullImageFile.save(fullImage, {
			metadata: {
				contentType: contentType,
				metadata: {
					originalName: cleanName,
					day: day.toString(),
					uploadDate: new Date().toISOString(),
					quality: "maximum",
					format: metadata.format || "unknown",
					originalSize: imageBuffer.length.toString(),
					processedSize: fullImage.length.toString(),
					width: metadata.width?.toString(),
					height: metadata.height?.toString(),
				},
			},
			public: true,
		});

		// Upload thumbnail
		const thumbnailFile = bucket.file(thumbnailPath);
		await thumbnailFile.save(thumbnail, {
			metadata: {
				contentType: "image/jpeg",
				metadata: {
					originalName: cleanName,
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
			filename: finalFilename,
			thumbnailUrl,
			fullUrl,
			title: baseName,
			day,
			uploadDate: new Date().toISOString(),
			gcsPath: fullImagePath,
			originalSize: imageBuffer.length,
			dimensions:
				metadata.width && metadata.height
					? {
							width: metadata.width,
							height: metadata.height,
					  }
					: undefined,
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

		// Filter only original images (not thumbnails) - support both /full/ and /originals/ paths
		const fullImages = files.filter(
			(file) =>
				(file.name.includes("/full/") || file.name.includes("/originals/")) &&
				!file.name.endsWith("/")
		);

		for (const file of fullImages) {
			try {
				const [metadata] = await file.getMetadata();
				const customMetadata = metadata.metadata || {};

				// Extract day from path
				const dayMatch = file.name.match(/day-(\d+)/);
				const day = dayMatch ? parseInt(dayMatch[1]) : 1;

				// Generate thumbnail path - handle both /full/ and /originals/ structures
				let thumbnailPath: string;
				if (file.name.includes("/full/")) {
					thumbnailPath = file.name
						.replace("/full/", "/thumbnails/")
						.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
				} else if (file.name.includes("/originals/")) {
					thumbnailPath = file.name
						.replace("/originals/", "/thumbnails/")
						.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
				} else {
					// Fallback: assume it's in a full-like structure
					thumbnailPath = file.name.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
				}

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

	// Delete corresponding thumbnail - handle both /full/ and /originals/ structures
	let thumbnailPath: string;
	if (gcsPath.includes("/full/")) {
		thumbnailPath = gcsPath
			.replace("/full/", "/thumbnails/")
			.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
	} else if (gcsPath.includes("/originals/")) {
		thumbnailPath = gcsPath
			.replace("/originals/", "/thumbnails/")
			.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
	} else {
		// Fallback: assume it's in a full-like structure
		thumbnailPath = gcsPath.replace(/(\.[^.]+)$/, "_thumb.jpg"); // Force .jpg for thumbnails
	}

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

/**
 * Update images.json file with filename-based data structure
 */
export async function updateImagesJsonWithFilenames(
	newImages: ImageDataByFileName[]
): Promise<void> {
	try {
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
		const publicImagesPath = path.join(process.cwd(), "public/data/images.json");
		let imagesArray: any[] = [];

		// Try to read existing data
		try {
			const { readFile } = await import("fs/promises");
			const existingJson = await readFile(srcImagesPath, "utf-8");
			const existingData = JSON.parse(existingJson);

			// If existing data is an object with filenames as keys, convert to array
			if (!Array.isArray(existingData)) {
				imagesArray = Object.values(existingData).map((img: any, index) => ({
					id: index + 1, // Create sequential IDs
					thumbnailUrl: img.thumbnailUrl,
					fullUrl: img.fullUrl,
					title: img.title || img.filename,
					day: img.day || 1,
					uploadDate: img.uploadDate || new Date().toISOString(),
					gcsPath: img.gcsPath,
					filename: img.filename,
				}));
			} else {
				imagesArray = existingData;
			}
		} catch {
			console.log("No existing images.json found, creating new one");
		}

		// Convert new images to array format with IDs and add to the beginning
		const newImagesArray = newImages.map((img, index) => ({
			id: imagesArray.length + index + 1, // Create sequential IDs after existing ones
			thumbnailUrl: img.thumbnailUrl,
			fullUrl: img.fullUrl,
			title: img.title || img.filename,
			day: img.day || 1,
			uploadDate: img.uploadDate || new Date().toISOString(),
			gcsPath: img.gcsPath,
			filename: img.filename,
		}));

		// Add new images to the beginning of the array
		imagesArray.unshift(...newImagesArray);

		// Write updated data back to both src and public folders
		const { writeFile, mkdir } = await import("fs/promises");

		// Ensure directories exist
		await mkdir(path.dirname(srcImagesPath), { recursive: true });
		await mkdir(path.dirname(publicImagesPath), { recursive: true });

		await writeFile(srcImagesPath, JSON.stringify(imagesArray, null, 2), "utf-8");

		await writeFile(
			publicImagesPath,
			JSON.stringify(imagesArray, null, 2),
			"utf-8"
		);

		console.log(`Updated images.json with ${newImages.length} new images`);
	} catch (error) {
		console.error("Error updating images.json:", error);
		throw new Error("Failed to update images.json file");
	}
}

/**
 * Delete image by filename from GCS and update images.json
 */
export async function deleteImageByFilename(filename: string): Promise<void> {
	try {
		// Find the image in the current data structure
		const imagesJsonPath = path.join(process.cwd(), "src/data/images.json");
		const { readFile, writeFile } = await import("fs/promises");

		let existingData: Record<string, ImageDataByFileName> = {};
		try {
			const existingJson = await readFile(imagesJsonPath, "utf-8");
			existingData = JSON.parse(existingJson);
		} catch {
			throw new Error("Could not read images.json file");
		}

		const imageData = existingData[filename];
		if (!imageData) {
			throw new Error(`Image with filename ${filename} not found`);
		}

		// Delete from GCS
		const fullImageFile = bucket.file(imageData.gcsPath);
		const thumbnailPath = imageData.gcsPath
			.replace("/full/", "/thumbnails/")
			.replace(/(\.[^.]+)$/, "_thumb.jpg");
		const thumbnailFile = bucket.file(thumbnailPath);

		await Promise.all([
			fullImageFile
				.delete()
				.catch(() => console.log("Full image not found in GCS")),
			thumbnailFile
				.delete()
				.catch(() => console.log("Thumbnail not found in GCS")),
		]);

		// Remove from local data
		delete existingData[filename];

		// Write updated data back to file
		await writeFile(
			imagesJsonPath,
			JSON.stringify(existingData, null, 2),
			"utf-8"
		);

		console.log(`Deleted image: ${filename}`);
	} catch (error) {
		console.error("Error deleting image:", error);
		throw new Error(
			`Failed to delete image: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}
