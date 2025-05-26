import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { moveImageToNewDay, generateNewImageUrls } from "@/lib/file-manager";
import fs from "fs/promises";
import path from "path";

interface ImageData {
	id: number;
	title: string;
	fullUrl: string;
	thumbnailUrl: string;
	day?: number;
	gcsPath?: string;
	uploadDate?: string;
	category?: string;
	tags?: string[];
	isHighlight?: boolean;
}

export async function PUT(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { imageId, day, title, category, tags, isHighlight } =
			await request.json();

		if (!imageId) {
			return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
		}

		// Validate day if provided
		if (day !== undefined && (day < 1 || day > 30)) {
			return NextResponse.json(
				{ error: "Day must be between 1 and 30" },
				{ status: 400 }
			);
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

		// Find the image to update
		const imageIndex = imagesData.findIndex(
			(img) => img.id === parseInt(imageId)
		);
		if (imageIndex === -1) {
			return NextResponse.json({ error: "Image not found" }, { status: 404 });
		}

		const currentImage = imagesData[imageIndex];
		const updatedImage = { ...currentImage };

		// If day is changing and we have a GCS path, move the files
		if (day !== undefined && day !== currentImage.day && currentImage.gcsPath) {
			try {
				console.log(
					`🔄 Moving image ${imageId} from day ${currentImage.day} to day ${day}`
				);

				const { newFullPath, newThumbnailPath } = await moveImageToNewDay(
					currentImage.gcsPath,
					day,
					currentImage.id,
					currentImage.title || `image-${currentImage.id}`
				);

				const { fullUrl, thumbnailUrl } = generateNewImageUrls(
					newFullPath,
					newThumbnailPath
				);

				updatedImage.gcsPath = newFullPath;
				updatedImage.fullUrl = fullUrl;
				updatedImage.thumbnailUrl = thumbnailUrl;
				updatedImage.day = day;

				console.log(`✅ Successfully moved image files to day ${day}`);
			} catch (error) {
				console.error("Failed to move image files:", error);
				return NextResponse.json(
					{ error: "Failed to move image files to new day" },
					{ status: 500 }
				);
			}
		} else if (day !== undefined) {
			updatedImage.day = day;
		}

		// Handle highlight setting - only one image per day can be highlighted
		if (isHighlight !== undefined) {
			if (isHighlight) {
				// Remove highlight from other images in the same day
				imagesData.forEach((img, index) => {
					if (
						img.day === (updatedImage.day || currentImage.day) &&
						index !== imageIndex
					) {
						img.isHighlight = false;
					}
				});
			}
			updatedImage.isHighlight = isHighlight;
		}

		// Update other fields
		if (title !== undefined) updatedImage.title = title;
		if (category !== undefined) updatedImage.category = category;
		if (tags !== undefined) updatedImage.tags = tags;

		imagesData[imageIndex] = updatedImage;

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
			console.log("Images cache cleared after update");
		} catch (error) {
			console.error("Failed to clear images cache:", error);
			// Don't fail the update if cache clearing fails
		}

		return NextResponse.json({
			success: true,
			message:
				day !== currentImage.day && currentImage.gcsPath
					? "Image updated and moved to new day successfully"
					: "Image updated successfully",
			updatedImage: imagesData[imageIndex],
			fileMoved: day !== currentImage.day && currentImage.gcsPath,
		});
	} catch (error) {
		console.error("Update image error:", error);
		return NextResponse.json(
			{ error: "Failed to update image" },
			{ status: 500 }
		);
	}
}
