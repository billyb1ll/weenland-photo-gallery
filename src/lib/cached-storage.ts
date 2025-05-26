import { UploadResult, listImagesFromGCS } from "./storage";

// Cache to store image lists with expiration
let imageCache: {
	images: UploadResult[];
	timestamp: number;
	expiresIn: number;
} | null = null;

// Cache expiration time in milliseconds (default: 5 minutes)
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get images with caching to reduce Google Cloud Storage API calls
 * @param forceRefresh Force refresh the cache
 * @param expiresIn Cache expiration time in milliseconds
 */
export async function getCachedImages(
	forceRefresh = false,
	expiresIn = DEFAULT_CACHE_EXPIRATION
): Promise<UploadResult[]> {
	const now = Date.now();

	// Return cached images if they exist and haven't expired
	if (
		!forceRefresh &&
		imageCache &&
		now - imageCache.timestamp < imageCache.expiresIn
	) {
		console.log("📋 Using cached images list");
		return imageCache.images;
	}

	// Otherwise fetch fresh data
	console.log("📋 Fetching fresh images from GCS");
	try {
		const images = await listImagesFromGCS();

		// Update cache
		imageCache = {
			images,
			timestamp: now,
			expiresIn,
		};

		return images;
	} catch (error) {
		console.error("Error fetching images:", error);

		// If we have a cache, return it even if expired as fallback
		if (imageCache) {
			console.log("📋 Using expired cache as fallback");
			return imageCache.images;
		}

		throw error;
	}
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
	imageCache = null;
	console.log("🧹 Image cache cleared");
}

/**
 * Check if image cache exists and get info about it
 */
export function getImageCacheStatus(): {
	exists: boolean;
	imageCount: number;
	age: number;
	isExpired: boolean;
} {
	if (!imageCache) {
		return {
			exists: false,
			imageCount: 0,
			age: 0,
			isExpired: true,
		};
	}

	const now = Date.now();
	const age = now - imageCache.timestamp;

	return {
		exists: true,
		imageCount: imageCache.images.length,
		age,
		isExpired: age > imageCache.expiresIn,
	};
}

// Export types
export type { UploadResult };
