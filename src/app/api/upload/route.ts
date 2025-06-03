import { NextRequest, NextResponse } from "next/server";
import { uploadImage, UploadResult } from "@/lib/unified-storage";
import {
	uploadOriginalImageToGCS,
	updateImagesJsonWithFilenames,
	ImageDataByFileName,
} from "@/lib/storage";
import { verifyAuth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const user = verifyAuth(request);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const day = parseInt(formData.get("day") as string) || 1;
		const title = formData.get("title") as string;
		const useFilenames = formData.get("useFilenames") === "true"; // New parameter

		if (!file) {
			return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น" },
				{ status: 400 }
			);
		}

		// No file size limit - allow full quality uploads
		console.log(
			`📁 Uploading image: ${file.name} (${(file.size / 1024 / 1024).toFixed(
				2
			)}MB)`
		);

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		if (useFilenames) {
			// Use filename-based upload system
			const uploadResult = await uploadOriginalImageToGCS(buffer, file.name, day);

			// Override with user-provided metadata
			const finalResult: ImageDataByFileName = {
				...uploadResult,
				title: title || uploadResult.title,
			};

			// Update images.json with filename-based data
			await updateImagesJsonWithFilenames([finalResult]);

			return NextResponse.json({
				success: true,
				message: "อัปโหลดรูปภาพสำเร็จ (filename-based)",
				image: finalResult,
			});
		} else {
			// Use traditional ID-based upload system
			// Read existing images to pass to upload function for ID generation
			const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
			let existingImages: Array<{ id: number; uploadDate: string }> = [];
			try {
				const fileContent = await fs.readFile(srcImagesPath, "utf8");
				existingImages = JSON.parse(fileContent);
			} catch {
				// File doesn't exist yet, start with empty array
			}

			// Upload using unified storage (will automatically choose GCS or mock)
			const uploadResult = await uploadImage(
				buffer,
				file.name,
				day,
				existingImages
			);

			// Override the upload result with user-provided metadata
			uploadResult.title = title || uploadResult.title;

			// Update images.json file with new image data
			await updateImagesJson(uploadResult);

			return NextResponse.json({
				success: true,
				message: "อัปโหลดรูปภาพสำเร็จ",
				image: uploadResult,
			});
		}

		// Clear the images cache to ensure fresh data is loaded
		try {
			await fetch(
				`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/images`,
				{
					method: "POST",
				}
			);
			console.log("Images cache cleared after upload");
		} catch (error) {
			console.error("Failed to clear images cache:", error);
			// Don't fail the upload if cache clearing fails
		}
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? `เกิดข้อผิดพลาด: ${error.message}`
						: "เกิดข้อผิดพลาดในการอัปโหลด",
			},
			{ status: 500 }
		);
	}
}

/**
 * Update the images.json file with new uploaded image
 */
async function updateImagesJson(newImage: UploadResult) {
	try {
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
		const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

		// Read current images
		let imagesData: UploadResult[] = [];
		try {
			const fileContent = await fs.readFile(srcImagesPath, "utf8");
			imagesData = JSON.parse(fileContent);
		} catch {
			console.log("Images file not found or empty, creating new one");
			imagesData = [];
		}

		// Add new image to the beginning of the array (newImage already has the correct ID)
		const imageForJson: UploadResult = {
			id: newImage.id, // Use the new date-based ID generated during upload
			thumbnailUrl: newImage.thumbnailUrl,
			fullUrl: newImage.fullUrl,
			title: newImage.title, // Use the title from upload result
			day: newImage.day,
			uploadDate: newImage.uploadDate,
			gcsPath: newImage.gcsPath,
		};

		imagesData.unshift(imageForJson);

		const jsonContent = JSON.stringify(imagesData, null, 2);

		// Ensure directories exist
		await fs.mkdir(path.dirname(srcImagesPath), { recursive: true });
		await fs.mkdir(path.dirname(publicImagesPath), { recursive: true });

		// Write updated images to both locations
		await fs.writeFile(srcImagesPath, jsonContent);
		await fs.writeFile(publicImagesPath, jsonContent);
	} catch (error) {
		console.error("Error updating images.json:", error);
		// Don't throw error as the upload was successful
	}
}
