import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { deleteImageFromGCS } from "@/lib/storage";
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

export async function DELETE(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { imageId } = await request.json();

		if (!imageId) {
			return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
		}

		// Read current images
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
		const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

		let imagesData: ImageData[] = [];
		try {
			const fileContent = await fs.readFile(srcImagesPath, "utf8");
			imagesData = JSON.parse(fileContent);
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
			message: "Image deleted successfully",
			deletedImageId: imageId,
		});
	} catch (error) {
		console.error("Delete image error:", error);
		return NextResponse.json(
			{ error: "Failed to delete image" },
			{ status: 500 }
		);
	}
}
