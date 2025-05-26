import {
	uploadImageToGCS,
	listImagesFromGCS,
	deleteImageFromGCS,
	UploadResult,
} from "./storage";

// Simple in-memory cache for storage operations
interface CacheEntry<T> {
	timestamp: number;
	expiresIn: number;
	data: T;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
	const entry = cache[key] as CacheEntry<T> | undefined;
	if (!entry) return null;

	const now = Date.now();
	if (now - entry.timestamp > entry.expiresIn) {
		// Cache expired
		delete cache[key];
		return null;
	}

	return entry.data;
}

function setCachedData<T>(
	key: string,
	data: T,
	expiresIn = DEFAULT_CACHE_EXPIRATION
): void {
	cache[key] = {
		timestamp: Date.now(),
		expiresIn,
		data,
	};
}

function clearCache(): void {
	Object.keys(cache).forEach((key) => delete cache[key]);
}

// Check if GCS is available (has proper permissions)
async function isGCSAvailable(): Promise<boolean> {
	try {
		// Test if we can access the bucket
		const { Storage } = await import("@google-cloud/storage");
		const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

		let storage;
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
			const credentials = JSON.parse(
				process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
			);
			storage = new Storage({ projectId, credentials });
		} else {
			storage = new Storage({
				projectId,
				keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
			});
		}

		const bucketName =
			process.env.GOOGLE_CLOUD_BUCKET_NAME || "weenland-photo-gallery";
		const bucket = storage.bucket(bucketName);

		// Try to access bucket metadata
		await bucket.getMetadata();
		return true;
	} catch (error) {
		console.error(
			"❌ GCS not available, check your configuration:",
			error instanceof Error ? error.message : "Unknown error"
		);
		return false;
	}
}

export async function uploadImage(
	imageBuffer: Buffer,
	originalName: string,
	day: number,
	existingImages: Array<{ id: number; uploadDate: string }> = []
): Promise<UploadResult> {
	const gcsAvailable = await isGCSAvailable();

	if (!gcsAvailable) {
		throw new Error(
			"Google Cloud Storage is not available. Please check your configuration."
		);
	}

	console.log("📤 Using Google Cloud Storage for upload");
	try {
		const result = await uploadImageToGCS(
			imageBuffer,
			originalName,
			day,
			existingImages
		);
		// Clear the cache after upload
		delete cache["listImages"];
		return result;
	} catch (error) {
		console.error("Error during upload:", error);
		throw error;
	}
}

export async function listImages(
	forceRefresh = false
): Promise<UploadResult[]> {
	// Check cache first if not forced to refresh
	if (!forceRefresh) {
		const cachedImages = getCachedData<UploadResult[]>("listImages");
		if (cachedImages) {
			console.log("📋 Using cached image list");
			return cachedImages;
		}
	}

	const gcsAvailable = await isGCSAvailable();

	if (!gcsAvailable) {
		throw new Error(
			"Google Cloud Storage is not available. Please check your configuration."
		);
	}

	console.log("📋 Using Google Cloud Storage for listing");
	try {
		const images = await listImagesFromGCS();
		// Cache the results
		setCachedData<UploadResult[]>("listImages", images);
		return images;
	} catch (error) {
		console.error("Error listing images from GCS:", error);
		throw error;
	}
}

export async function deleteImage(gcsPath: string): Promise<boolean> {
	const gcsAvailable = await isGCSAvailable();

	if (!gcsAvailable) {
		throw new Error(
			"Google Cloud Storage is not available. Please check your configuration."
		);
	}

	console.log("🗑️ Using Google Cloud Storage for deletion");
	try {
		await deleteImageFromGCS(gcsPath);
		// Clear the cache after deletion
		delete cache["listImages"];
		return true;
	} catch (error) {
		console.error("Failed to delete from GCS:", error);
		return false;
	}
}

export async function syncImages(): Promise<{
	added: number;
	errors: string[];
}> {
	const gcsAvailable = await isGCSAvailable();

	if (!gcsAvailable) {
		throw new Error(
			"Google Cloud Storage is not available. Please check your configuration."
		);
	}

	// Clear cache to ensure fresh data
	delete cache["listImages"];

	// Perform sync operation
	try {
		const images = await listImagesFromGCS();
		// Re-cache the fresh data
		setCachedData<UploadResult[]>("listImages", images);
		return { added: 0, errors: [] };
	} catch (error) {
		return {
			added: 0,
			errors: [error instanceof Error ? error.message : "Unknown error"],
		};
	}
}

// Expose function to check cache status
export function getImageCacheStatus(): {
	exists: boolean;
	imageCount: number;
	age: number | null;
	isExpired: boolean;
} {
	const cacheEntry = cache["listImages"] as
		| CacheEntry<UploadResult[]>
		| undefined;

	if (!cacheEntry) {
		return {
			exists: false,
			imageCount: 0,
			age: null,
			isExpired: true,
		};
	}

	const now = Date.now();
	const age = now - cacheEntry.timestamp;

	return {
		exists: true,
		imageCount: cacheEntry.data.length,
		age,
		isExpired: age > cacheEntry.expiresIn,
	};
}

// Function to manually clear image cache
export function clearImageCache(): void {
	delete cache["listImages"];
	console.log("🧹 Image cache cleared");
}

export type { UploadResult };
