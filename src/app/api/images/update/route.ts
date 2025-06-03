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
	isHighlight?: boolean;
}

interface ImageDataByFilename {
	filename: string;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	day: number;
	uploadDate: string;
	gcsPath: string;
	originalSize?: number;
	isHighlight?: boolean;
	dimensions?: {
		width: number;
		height: number;
	};
}

export async function PUT(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { imageId, filename, day, title, isHighlight } = await request.json();

		// Determine if this is a filename-based or ID-based update
		if (filename) {
			// Use filename-based update
			return await updateImageByFilename(filename, { day, title, isHighlight });
		} else if (imageId) {
			// Use traditional ID-based update
			return await updateImageById(imageId, { day, title, isHighlight });
		} else {
			return NextResponse.json(
				{ error: "Either imageId or filename is required" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Update image error:", error);
		return NextResponse.json(
			{ error: "Failed to update image" },
			{ status: 500 }
		);
	}
}

/**
 * Update image by filename (filename-based system)
 */
async function updateImageByFilename(
	filename: string,
	updates: { day?: number; title?: string; isHighlight?: boolean }
) {
	const { day, title, isHighlight } = updates;

	// Validate day if provided
	if (day !== undefined && (day < 1 || day > 30)) {
		return NextResponse.json(
			{ error: "Day must be between 1 and 30" },
			{ status: 400 }
		);
	}

	// Read current images data
	const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
	const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

	let imagesData: Record<string, ImageDataByFilename> = {};
	try {
		const fileContent = await fs.readFile(srcImagesPath, "utf8");
		const rawData = JSON.parse(fileContent);

		// Ensure we have filename-based data
		if (isFilenameBasedData(rawData)) {
			imagesData = rawData;
		} else {
			return NextResponse.json(
				{ error: "Cannot update by filename in ID-based data structure" },
				{ status: 400 }
			);
		}
	} catch {
		return NextResponse.json({ error: "Images data not found" }, { status: 404 });
	}

	// Find the image to update
	if (!imagesData[filename]) {
		return NextResponse.json({ error: "Image not found" }, { status: 404 });
	}

	const currentImage = imagesData[filename];
	const updatedImage = { ...currentImage };

	// Handle day change - note: filename-based system doesn't move files for day changes
	// The filename is the primary key, so we just update the day metadata
	if (day !== undefined) {
		updatedImage.day = day;
	}

	// Handle highlight setting - only one image per day can be highlighted
	if (isHighlight !== undefined) {
		if (isHighlight) {
			// Remove highlight from other images in the same day
			Object.keys(imagesData).forEach((key) => {
				if (
					imagesData[key].day === (updatedImage.day || currentImage.day) &&
					key !== filename
				) {
					imagesData[key].isHighlight = false;
				}
			});
		}
		updatedImage.isHighlight = isHighlight;
	}

	// Update other fields
	if (title !== undefined) updatedImage.title = title;

	// Update the image data
	imagesData[filename] = updatedImage;

	// Update JSON files
	const jsonContent = JSON.stringify(imagesData, null, 2);
	await fs.writeFile(srcImagesPath, jsonContent);
	await fs.writeFile(publicImagesPath, jsonContent);

	// Clear the images cache
	try {
		await fetch(
			`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/images`,
			{
				method: "POST",
			}
		);
		console.log("Images cache cleared after filename-based update");
	} catch (error) {
		console.error("Failed to clear images cache:", error);
	}

	return NextResponse.json({
		success: true,
		message: "Image updated successfully (filename-based)",
		updatedImage: updatedImage,
		filename: filename,
	});
}

/**
 * Update image by ID (traditional ID-based system)
 */
async function updateImageById(
	imageId: string,
	updates: { day?: number; title?: string; isHighlight?: boolean }
) {
	const { day, title, isHighlight } = updates;

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
		const rawData = JSON.parse(fileContent);

		// Convert filename-based data to ID-based if needed
		if (isFilenameBasedData(rawData)) {
			imagesData = Object.values(rawData).map((item, index) => ({
				id: index + 1,
				title: item.title,
				fullUrl: item.fullUrl,
				thumbnailUrl: item.thumbnailUrl,
				day: item.day,
				gcsPath: item.gcsPath,
				uploadDate: item.uploadDate,
				isHighlight: item.isHighlight,
			}));
		} else {
			imagesData = rawData as ImageData[];
		}
	} catch {
		return NextResponse.json({ error: "Images data not found" }, { status: 404 });
	}

	// Find the image to update
	const imageIndex = imagesData.findIndex((img) => img.id === parseInt(imageId));
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
		console.log("Images cache cleared after ID-based update");
	} catch (error) {
		console.error("Failed to clear images cache:", error);
		// Don't fail the update if cache clearing fails
	}

	return NextResponse.json({
		success: true,
		message:
			day !== currentImage.day && currentImage.gcsPath
				? "Image updated and moved to new day successfully (ID-based)"
				: "Image updated successfully (ID-based)",
		updatedImage: imagesData[imageIndex],
		fileMoved: day !== currentImage.day && currentImage.gcsPath,
	});
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
