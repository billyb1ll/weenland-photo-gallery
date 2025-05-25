import {
	uploadImageToGCS,
	listImagesFromGCS,
	deleteImageFromGCS,
	UploadResult,
} from "./storage";

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
	return await uploadImageToGCS(imageBuffer, originalName, day, existingImages);
}

export async function listImages(): Promise<UploadResult[]> {
	const gcsAvailable = await isGCSAvailable();

	if (!gcsAvailable) {
		throw new Error(
			"Google Cloud Storage is not available. Please check your configuration."
		);
	}

	console.log("📋 Using Google Cloud Storage for listing");
	return await listImagesFromGCS();
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

	// Simply use the listImagesFromGCS function as sync
	try {
		await listImagesFromGCS();
		return { added: 0, errors: [] };
	} catch (error) {
		return {
			added: 0,
			errors: [error instanceof Error ? error.message : "Unknown error"],
		};
	}
}

export type { UploadResult };
