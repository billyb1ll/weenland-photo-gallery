import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { deleteImageFromGCS, deleteImageByFilename } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

interface ImageData {
	id: number;
	gcsPath?: string;
	title?: string;
	fullUrl?: string;
	thumbnailUrl?: string;
	day?: number;
	uploadDate?: string;
}

interface ImageDataByFilename {
	filename: string;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	category: string;
	tags: string[];
	day: number;
	uploadDate: string;
	gcsPath: string;
	originalSize?: number;
	dimensions?: {
		width: number;
		height: number;
	};
}

export async function DELETE(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { imageId, filename } = await request.json();

		// Determine if this is a filename-based or ID-based deletion
		if (filename) {
			// Use filename-based deletion
			try {
				await deleteImageByFilename(filename);

				// Clear the images cache
				try {
					await fetch(
						`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/images`,
						{
							method: "POST",
						}
					);
					console.log("Images cache cleared after filename-based deletion");
				} catch (error) {
					console.error("Failed to clear images cache:", error);
				}

				return NextResponse.json({
					success: true,
					message: "Image deleted successfully (filename-based)",
					deletedFilename: filename,
				});
			} catch (error) {
				console.error("Error deleting image by filename:", error);
				return NextResponse.json(
					{
						error: `Failed to delete image: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					},
					{ status: 500 }
				);
			}
		} else if (imageId) {
			// Use traditional ID-based deletion
			const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
			const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

			let imagesData: ImageData[] = [];
			try {
				const fileContent = await fs.readFile(srcImagesPath, "utf8");
				const rawData = JSON.parse(fileContent);

				// Check if data is in filename-based format and convert if needed
				if (isFilenameBasedData(rawData)) {
					// Convert to array for ID-based processing
					imagesData = Object.values(rawData).map((item, index) => ({
						id: index + 1,
						thumbnailUrl: item.thumbnailUrl,
						fullUrl: item.fullUrl,
						title: item.title,
						category: item.category,
						tags: item.tags,
						day: item.day,
						uploadDate: item.uploadDate,
						gcsPath: item.gcsPath,
					}));
				} else {
					imagesData = rawData as ImageData[];
				}
			} catch {
				return NextResponse.json(
					{ error: "Images data not found" },
					{ status: 404 }
				);
			}

			// Find the image to delete
			const imageIndex = imagesData.findIndex(
				(img) => img.id === parseInt(imageId)
			);
			if (imageIndex === -1) {
				return NextResponse.json({ error: "Image not found" }, { status: 404 });
			}

			const imageToDelete = imagesData[imageIndex];

			// Delete from Google Cloud Storage if it exists there
			if (imageToDelete.gcsPath) {
				try {
					await deleteImageFromGCS(imageToDelete.gcsPath);
					console.log("✅ Deleted main image from GCS:", imageToDelete.gcsPath);
				} catch (error) {
					console.log(
						"⚠️ Main image not found in GCS (may already be deleted):",
						error
					);
				}

				// Also try to delete thumbnail
				try {
					const thumbnailPath = imageToDelete.gcsPath
						.replace("/full/", "/thumbnails/")
						.replace(/\.(jpg|jpeg|png|webp)$/i, "_thumb.$1");
					await deleteImageFromGCS(thumbnailPath);
					console.log("✅ Deleted thumbnail from GCS:", thumbnailPath);
				} catch (thumbError) {
					console.log("⚠️ Thumbnail not found in GCS (may not exist):", thumbError);
				}
			}

			// Remove from images array
			imagesData.splice(imageIndex, 1);

			// Update JSON files
			const jsonContent = JSON.stringify(imagesData, null, 2);
			await fs.writeFile(srcImagesPath, jsonContent);
			await fs.writeFile(publicImagesPath, jsonContent);

			// Clear the images cache to ensure fresh data is loaded
			try {
				await fetch(
					`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/images`,
					{
						method: "POST",
					}
				);
				console.log("Images cache cleared after deletion");
			} catch (error) {
				console.error("Failed to clear images cache:", error);
				// Don't fail the deletion if cache clearing fails
			}

			return NextResponse.json({
				success: true,
				message: "Image deleted successfully (ID-based)",
				deletedImageId: imageId,
			});
		} else {
			return NextResponse.json(
				{ error: "Either imageId or filename is required" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Delete image error:", error);
		return NextResponse.json(
			{ error: "Failed to delete image" },
			{ status: 500 }
		);
	}
}

/**
 * Detect if the data structure is filename-based or ID-based
 */
function isFilenameBasedData(
	data: unknown
): data is Record<string, ImageDataByFilename> {
	if (!data || typeof data !== "object") return false;

	// Check if it's an array (ID-based) or object with filename keys
	if (Array.isArray(data)) return false;

	// Check if the keys look like filenames and values have filename property
	const keys = Object.keys(data as Record<string, unknown>);
	if (keys.length === 0) return false;

	const firstKey = keys[0];
	const firstValue = (data as Record<string, unknown>)[firstKey];

	return (
		typeof firstKey === "string" &&
		firstKey.includes(".") && // Likely a filename with extension
		firstValue !== null &&
		firstValue !== undefined &&
		typeof firstValue === "object" &&
		"filename" in firstValue &&
		"gcsPath" in firstValue
	);
}
