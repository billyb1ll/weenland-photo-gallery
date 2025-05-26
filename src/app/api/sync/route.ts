import { NextResponse } from "next/server";
import { listImagesFromGCS, checkGCSConnection } from "@/lib/storage";
import { migrateToDateBasedIds } from "@/lib/id-generator";
import fs from "fs/promises";
import path from "path";

export async function GET() {
	try {
		// Check if GCS is properly configured
		const isGCSConnected = await checkGCSConnection();
		if (!isGCSConnected) {
			return NextResponse.json(
				{
					success: false,
					error: "Google Cloud Storage ไม่ได้เชื่อมต่อ กรุณาตรวจสอบการตั้งค่า",
				},
				{ status: 500 }
			);
		}

		// Update paths - write to both src/data and public/data for accessibility
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");
		const publicImagesPath = path.join(process.cwd(), "public/data/images.json");

		// Ensure directories exist
		await fs.mkdir(path.dirname(srcImagesPath), { recursive: true });
		await fs.mkdir(path.dirname(publicImagesPath), { recursive: true });

		// Read existing images from the local JSON file
		let existingImages: Array<{
			id: number;
			uploadDate: string;
			gcsPath?: string;
			day?: number;
		}> = [];
		try {
			const fileContent = await fs.readFile(srcImagesPath, "utf8");
			existingImages = JSON.parse(fileContent);
		} catch {
			console.log("No existing images file found, starting fresh");
		}

		// Get fresh images from GCS (these already have proper IDs from the new system)
		const gcsImages = await listImagesFromGCS();

		// Migrate existing images to new ID format if needed
		// Group images by day and migrate each group separately
		const imagesByDay = new Map<number, typeof existingImages>();
		for (const image of existingImages) {
			const day = image.day || 1;
			if (!imagesByDay.has(day)) {
				imagesByDay.set(day, []);
			}
			imagesByDay.get(day)!.push(image);
		}

		const migratedExistingImages: typeof existingImages = [];
		for (const [day, dayImages] of imagesByDay) {
			const migratedDayImages = migrateToDateBasedIds(dayImages, day);
			migratedExistingImages.push(...migratedDayImages);
		}

		// Merge existing images with new GCS images, removing duplicates by gcsPath
		const existingGcsPaths = new Set(
			migratedExistingImages.filter((img) => img.gcsPath).map((img) => img.gcsPath)
		);
		const newGcsImages = gcsImages.filter(
			(img) => !existingGcsPaths.has(img.gcsPath)
		);

		// Combine all images: migrated existing + new from GCS
		const allImages = [...migratedExistingImages, ...newGcsImages];

		// Sort images by day and upload date
		allImages.sort((a, b) => {
			const dayA = a.day || 1;
			const dayB = b.day || 1;
			if (dayA !== dayB) {
				return dayA - dayB;
			}
			return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
		});

		const jsonContent = JSON.stringify(allImages, null, 2);

		// Write to both locations
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
			console.log("Images cache cleared after sync");
		} catch (error) {
			console.error("Failed to clear images cache:", error);
			// Don't fail the sync if cache clearing fails
		}

		return NextResponse.json({
			success: true,
			message: `ซิงค์รูปภาพสำเร็จ พบรูปภาพรวม ${allImages.length} รูป (เก่า: ${existingImages.length}, ใหม่จาก GCS: ${newGcsImages.length})`,
			gcsImageCount: newGcsImages.length,
			totalImages: allImages.length,
		});
	} catch (error) {
		console.error("Sync error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? `เกิดข้อผิดพลาดในการซิงค์: ${error.message}`
						: "เกิดข้อผิดพลาดในการซิงค์รูปภาพ",
			},
			{ status: 500 }
		);
	}
}

export async function POST() {
	// Same as GET for convenience
	return GET();
}
