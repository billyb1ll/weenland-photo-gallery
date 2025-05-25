import { Storage } from "@google-cloud/storage";
import path from "path";

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

/**
 * Move image files to a different day folder when admin changes the day
 * @param gcsPath - Current GCS path of the image
 * @param newDay - New day number
 * @param imageId - Image ID for naming
 * @param originalName - Original filename
 * @returns New GCS paths for full image and thumbnail
 */
export async function moveImageToNewDay(
	gcsPath: string,
	newDay: number,
	imageId: number,
	originalName: string
): Promise<{ newFullPath: string; newThumbnailPath: string }> {
	try {
		const extension = path.extname(originalName) || ".jpg";
		const baseName = path.basename(originalName, extension);
		const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");

		// Create new paths
		const newFullPath = `images/day-${newDay}/full/${imageId}-${cleanBaseName}${extension}`;
		const newThumbnailPath = `images/day-${newDay}/thumbnails/${imageId}-${cleanBaseName}_thumb${extension}`;

		// Get current thumbnail path
		const currentThumbnailPath = gcsPath
			.replace("/full/", "/thumbnails/")
			.replace(/(\.[^.]+)$/, "_thumb$1");

		// Copy files to new locations
		const sourceFullFile = bucket.file(gcsPath);
		const sourceThumbnailFile = bucket.file(currentThumbnailPath);

		const destFullFile = bucket.file(newFullPath);
		const destThumbnailFile = bucket.file(newThumbnailPath);

		// Check if source files exist before copying
		const [fullExists] = await sourceFullFile.exists();
		const [thumbnailExists] = await sourceThumbnailFile.exists();

		if (fullExists) {
			await sourceFullFile.copy(destFullFile);
			console.log(`✅ Copied full image: ${gcsPath} -> ${newFullPath}`);
		}

		if (thumbnailExists) {
			await sourceThumbnailFile.copy(destThumbnailFile);
			console.log(
				`✅ Copied thumbnail: ${currentThumbnailPath} -> ${newThumbnailPath}`
			);
		}

		// Delete old files after successful copy
		if (fullExists) {
			await sourceFullFile.delete();
			console.log(`🗑️ Deleted old full image: ${gcsPath}`);
		}

		if (thumbnailExists) {
			await sourceThumbnailFile.delete();
			console.log(`🗑️ Deleted old thumbnail: ${currentThumbnailPath}`);
		}

		return {
			newFullPath,
			newThumbnailPath,
		};
	} catch (error) {
		console.error("Error moving image files:", error);
		throw new Error(`Failed to move image files: ${error}`);
	}
}

/**
 * Generate new URLs for moved images
 * @param newFullPath - New full image path
 * @param newThumbnailPath - New thumbnail path
 * @returns Object with new URLs
 */
export function generateNewImageUrls(
	newFullPath: string,
	newThumbnailPath: string
) {
	const baseUrl = `https://storage.googleapis.com/${bucketName}`;

	return {
		fullUrl: `${baseUrl}/${newFullPath}`,
		thumbnailUrl: `${baseUrl}/${newThumbnailPath}`,
	};
}
