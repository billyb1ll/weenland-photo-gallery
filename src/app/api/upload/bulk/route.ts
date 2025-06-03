import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const initStorage = () => {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

	if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
		const credentials = JSON.parse(
			process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
		);
		return new Storage({
			projectId,
			credentials,
		});
	} else {
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

interface BulkUploadResult {
	success: boolean;
	uploaded: string[];
	failed: Array<{ filename: string; error: string }>;
	totalProcessed: number;
}

interface ImageDataByFileName {
	filename: string;
	title: string;
	thumbnailUrl: string;
	fullUrl: string;
	uploadDate: string;
	day: number;
	size: number;
	dimensions: {
		width: number;
		height: number;
	};
	originalName: string;
	gcsPath: string;
}

/**
 * Upload image preserving original format and quality
 */
async function uploadOriginalImageToGCS(
	imageBuffer: Buffer,
	originalName: string,
	day: number
): Promise<ImageDataByFileName> {
	const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
	const extension = path.extname(cleanName).toLowerCase();
	const baseName = path.basename(cleanName, extension);

	// Use original filename as the unique identifier
	const filename = `${baseName}${extension}`;

	// Get image metadata
	const metadata = await sharp(imageBuffer).metadata();

	// Store the original image without any modification
	const fullImagePath = `images/day-${day}/originals/${filename}`;

	// Create a thumbnail for previews only
	const thumbnailBuffer = await sharp(imageBuffer)
		.resize(400, 300, {
			fit: "cover",
			withoutEnlargement: true,
		})
		.jpeg({ quality: 85 })
		.toBuffer();

	const thumbnailPath = `images/day-${day}/thumbnails/${baseName}_thumb.jpg`;

	// Upload original image (preserve exact format and quality)
	const fullImageFile = bucket.file(fullImagePath);
	await fullImageFile.save(imageBuffer, {
		metadata: {
			contentType:
				metadata.format === "png"
					? "image/png"
					: metadata.format === "webp"
					? "image/webp"
					: metadata.format === "gif"
					? "image/gif"
					: "image/jpeg",
			metadata: {
				originalName,
				day: day.toString(),
				uploadDate: new Date().toISOString(),
				preserved: "true", // Mark as original quality preserved
				format: metadata.format || "unknown",
				originalSize: imageBuffer.length.toString(),
				width: metadata.width?.toString() || "unknown",
				height: metadata.height?.toString() || "unknown",
			},
		},
		public: true,
	});

	// Upload thumbnail
	const thumbnailFile = bucket.file(thumbnailPath);
	await thumbnailFile.save(thumbnailBuffer, {
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
		filename, // Use filename as the primary identifier
		title: baseName,
		thumbnailUrl,
		fullUrl,
		uploadDate: new Date().toISOString(),
		day,
		size: imageBuffer.length,
		dimensions: {
			width: metadata.width || 0,
			height: metadata.height || 0,
		},
		originalName,
		gcsPath: fullImagePath,
	};
}

/**
 * Update images.json with filename-based system
 */
async function updateImagesJsonWithFilenames(newImages: ImageDataByFileName[]) {
	try {
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
		const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

		// Read current images
		let imagesData: ImageDataByFileName[] = [];
		try {
			const fileContent = await fs.readFile(srcImagesPath, "utf8");
			const parsedData = JSON.parse(fileContent);

			// Check if the data is filename-based (object) or array-based
			if (Array.isArray(parsedData)) {
				// Convert array to array if needed
				imagesData = parsedData;
			} else if (typeof parsedData === "object" && parsedData !== null) {
				// If it's an object with filename keys, convert to array
				imagesData = Object.values(parsedData);
			} else {
				console.log("Invalid data format, creating new array");
				imagesData = [];
			}
		} catch {
			console.log("Images file not found or empty, creating new one");
			imagesData = [];
		}

		// Ensure imagesData is an array before using map
		if (!Array.isArray(imagesData)) {
			console.log("Forcing imagesData to be an array");
			imagesData = [];
		}

		// Add new images, avoiding duplicates by filename
		const existingFilenames = new Set(imagesData.map((img) => img.filename));
		const uniqueNewImages = newImages.filter(
			(img) => !existingFilenames.has(img.filename)
		);

		// Add new images to the beginning of the array
		imagesData.unshift(...uniqueNewImages);

		const jsonContent = JSON.stringify(imagesData, null, 2);

		// Ensure directories exist
		await fs.mkdir(path.dirname(srcImagesPath), { recursive: true });
		await fs.mkdir(path.dirname(publicImagesPath), { recursive: true });

		// Write updated images to both locations
		await fs.writeFile(srcImagesPath, jsonContent);
		await fs.writeFile(publicImagesPath, jsonContent);

		console.log(
			`✅ Updated images.json with ${uniqueNewImages.length} new images`
		);
	} catch (error) {
		console.error("Error updating images.json:", error);
		throw error;
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const day = parseInt(formData.get("day") as string) || 1;

		// Get all files from the form data
		const files: File[] = [];
		for (const [key, value] of formData.entries()) {
			if (key.startsWith("files[") && value instanceof File) {
				files.push(value);
			}
		}

		if (files.length === 0) {
			return NextResponse.json({ error: "No files provided" }, { status: 400 });
		}

		console.log(`📁 Starting bulk upload of ${files.length} files to day ${day}`);

		const results: BulkUploadResult = {
			success: true,
			uploaded: [],
			failed: [],
			totalProcessed: 0,
		};

		const uploadedImages: ImageDataByFileName[] = [];

		// Process files in batches to avoid memory issues
		const BATCH_SIZE = 50; // Process 50 files at a time

		for (let i = 0; i < files.length; i += BATCH_SIZE) {
			const batch = files.slice(i, i + BATCH_SIZE);
			console.log(
				`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
					files.length / BATCH_SIZE
				)}`
			);

			const batchPromises = batch.map(async (file) => {
				try {
					// Validate file type
					if (!file.type.startsWith("image/")) {
						throw new Error(`${file.name}: Not an image file`);
					}

					console.log(
						`📤 Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
					);

					// Convert file to buffer
					const arrayBuffer = await file.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);

					// Upload with original quality preserved
					const uploadResult = await uploadOriginalImageToGCS(
						buffer,
						file.name,
						day
					);

					uploadedImages.push(uploadResult);
					results.uploaded.push(file.name);

					console.log(`✅ Successfully uploaded: ${file.name}`);
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					console.error(`❌ Failed to upload ${file.name}:`, errorMessage);
					results.failed.push({
						filename: file.name,
						error: errorMessage,
					});
				}

				results.totalProcessed++;
			});

			// Wait for current batch to complete before proceeding
			await Promise.all(batchPromises);

			// Add a small delay between batches to avoid overwhelming the system
			if (i + BATCH_SIZE < files.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		// Update images.json with all uploaded images
		if (uploadedImages.length > 0) {
			await updateImagesJsonWithFilenames(uploadedImages);
		}

		// Clear the images cache
		try {
			await fetch(
				`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/images`,
				{
					method: "POST",
				}
			);
			console.log("Images cache cleared after bulk upload");
		} catch (error) {
			console.error("Failed to clear images cache:", error);
		}

		// Set success to false if more than 10% of files failed
		if (results.failed.length > files.length * 0.1) {
			results.success = false;
		}

		return NextResponse.json({
			success: results.success,
			message: `Bulk upload completed: ${results.uploaded.length} successful, ${results.failed.length} failed`,
			results,
		});
	} catch (error) {
		console.error("Bulk upload error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Bulk upload failed",
			},
			{ status: 500 }
		);
	}
}
