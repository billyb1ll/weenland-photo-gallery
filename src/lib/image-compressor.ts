/**
 * Image compression utilities for efficient storage and delivery
 */

// Basic configuration for compression quality levels
export interface CompressionOptions {
	quality: number; // 0-1 where 1 is highest quality
	maxWidth?: number; // Maximum width to resize to
	maxHeight?: number; // Maximum height to resize to
	format?: "jpeg" | "webp" | "png"; // Output format
	preserveTransparency?: boolean; // Whether to preserve transparency (only for PNG)
}

export const COMPRESSION_PRESETS = {
	ORIGINAL: { quality: 1.0, format: "png" } as CompressionOptions, // Maximum quality, no compression
	HIGH: { quality: 0.95, format: "webp" } as CompressionOptions,
	MEDIUM: { quality: 0.75, format: "webp" } as CompressionOptions,
	LOW: { quality: 0.6, format: "webp" } as CompressionOptions,
	THUMBNAIL: {
		quality: 0.85,
		maxWidth: 400,
		maxHeight: 400,
		format: "jpeg",
	} as CompressionOptions,
	STORAGE_OPTIMIZED: { quality: 0.75, format: "webp" } as CompressionOptions,
};

/**
 * Compress an image file using the browser's Canvas API
 * @param file Original image file
 * @param options Compression options
 * @returns Promise that resolves to a compressed Blob
 */
export async function compressImage(
	file: File | Blob,
	options: CompressionOptions = COMPRESSION_PRESETS.MEDIUM
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const {
			quality,
			maxWidth,
			maxHeight,
			format = "webp",
			preserveTransparency = false,
		} = options;

		// Create image and canvas elements
		const img = new Image();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			reject(new Error("Could not get canvas context"));
			return;
		}

		// Set up image load handler
		img.onload = () => {
			// Calculate dimensions while maintaining aspect ratio
			let width = img.width;
			let height = img.height;

			if (maxWidth && width > maxWidth) {
				height = (height * maxWidth) / width;
				width = maxWidth;
			}

			if (maxHeight && height > maxHeight) {
				width = (width * maxHeight) / height;
				height = maxHeight;
			}

			// Set canvas dimensions
			canvas.width = width;
			canvas.height = height;

			// For PNG with transparency
			if (preserveTransparency) {
				ctx.clearRect(0, 0, width, height);
			} else {
				// Fill with white background for JPEGs
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, width, height);
			}

			// Draw image on canvas
			ctx.drawImage(img, 0, 0, width, height);

			// Convert to the specified format
			let mimeType: string;
			switch (format) {
				case "webp":
					mimeType = "image/webp";
					break;
				case "png":
					mimeType = "image/png";
					break;
				case "jpeg":
				default:
					mimeType = "image/jpeg";
					break;
			}

			// Get compressed image as blob
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("Failed to compress image"));
					}
				},
				mimeType,
				quality
			);
		};

		// Handle errors
		img.onerror = () => {
			reject(new Error("Failed to load image for compression"));
		};

		// Load image from file
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Get file size in human-readable format
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Calculate the compression ratio between original and compressed sizes
 * @param originalSize Original size in bytes
 * @param compressedSize Compressed size in bytes
 * @returns Compression ratio as a string percentage
 */
export function getCompressionRatio(
	originalSize: number,
	compressedSize: number
): string {
	if (originalSize === 0) return "0%";

	const ratio = (1 - compressedSize / originalSize) * 100;
	return `${ratio.toFixed(1)}%`;
}

/**
 * Batch compress multiple images
 * @param files Array of image files
 * @param options Compression options
 * @param progressCallback Optional callback for progress updates
 * @returns Promise that resolves to an array of compressed blobs
 */
export async function batchCompressImages(
	files: File[],
	options: CompressionOptions = COMPRESSION_PRESETS.MEDIUM,
	progressCallback?: (progress: number) => void
): Promise<Blob[]> {
	const total = files.length;
	const results: Blob[] = [];

	for (let i = 0; i < total; i++) {
		const compressed = await compressImage(files[i], options);
		results.push(compressed);

		if (progressCallback) {
			progressCallback((i + 1) / total);
		}
	}

	return results;
}
