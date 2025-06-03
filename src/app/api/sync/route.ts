import { NextRequest, NextResponse } from "next/server";
import { listImagesFromGCS, checkGCSConnection } from "@/lib/storage";
import { migrateToDateBasedIds } from "@/lib/id-generator";
import fs from "fs/promises";
import path from "path";

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

/**
 * Convert ID-based data structure to filename-based structure
 */
function convertIdBasedToFilenameStructure(
	idBasedData: Array<{
		id: number;
		gcsPath?: string;
		thumbnailUrl: string;
		fullUrl: string;
		title: string;
		category?: string;
		tags?: string[];
		day?: number;
		uploadDate: string;
	}>
): Record<string, ImageDataByFilename> {
	const filenameData: Record<string, ImageDataByFilename> = {};

	for (const item of idBasedData) {
		if (item.gcsPath) {
			const filename = path.basename(item.gcsPath);
			filenameData[filename] = {
				filename: filename,
				thumbnailUrl: item.thumbnailUrl,
				fullUrl: item.fullUrl,
				title: item.title,
				day: item.day || 1,
				uploadDate: item.uploadDate,
				gcsPath: item.gcsPath,
			};
		}
	}

	return filenameData;
}

/**
 * Clear the images cache
 */
async function clearImagesCache() {
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
}

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url);
		const useFilenames = searchParams.get("useFilenames") === "true";
		const forceUpdate = searchParams.get("forceUpdate") === "true";

		console.log(
			`🔄 Starting sync with ${
				useFilenames ? "filename-based" : "ID-based"
			} data structure ${forceUpdate ? "(force update mode)" : ""}`
		);

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

		if (useFilenames) {
			// Filename-based sync
			return await syncWithFilenameBasedStructure(
				srcImagesPath,
				publicImagesPath,
				forceUpdate
			);
		} else {
			// Traditional ID-based sync
			return await syncWithIdBasedStructure(
				srcImagesPath,
				publicImagesPath,
				forceUpdate
			);
		}
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

/**
 * Sync with filename-based data structure
 */
async function syncWithFilenameBasedStructure(
	srcImagesPath: string,
	publicImagesPath: string,
	forceUpdate: boolean = false
) {
	// Read existing filename-based data
	let existingData: Record<string, ImageDataByFilename> = {};
	try {
		const fileContent = await fs.readFile(srcImagesPath, "utf8");
		const rawData = JSON.parse(fileContent);

		// Check if data is filename-based
		if (isFilenameBasedData(rawData)) {
			existingData = rawData;
		} else {
			console.log("Converting from ID-based to filename-based structure");
			// Convert ID-based to filename-based structure if needed
			existingData = convertIdBasedToFilenameStructure(rawData);
		}
	} catch {
		console.log(
			"No existing images file found, starting fresh with filename-based structure"
		);
	}

	// Get fresh images from GCS
	const gcsImages = await listImagesFromGCS();

	// Convert GCS images to filename-based structure
	const newImagesData: Record<string, ImageDataByFilename> = {};
	let newImagesCount = 0;

	for (const gcsImage of gcsImages) {
		// Extract filename from GCS path
		const filename = path.basename(gcsImage.gcsPath);

		// If force update is enabled or the image doesn't exist yet, add it
		if (forceUpdate || !existingData[filename]) {
			newImagesData[filename] = {
				filename: filename,
				thumbnailUrl: gcsImage.thumbnailUrl,
				fullUrl: gcsImage.fullUrl,
				title: gcsImage.title,
				day: gcsImage.day,
				uploadDate: gcsImage.uploadDate,
				gcsPath: gcsImage.gcsPath,
			};
			newImagesCount++;
		}
	}

	// Merge existing and new data or replace with new data if force update is enabled
	const allImagesData = forceUpdate
		? newImagesData
		: { ...existingData, ...newImagesData };

	// Write to both locations
	const jsonContent = JSON.stringify(allImagesData, null, 2);
	await fs.writeFile(srcImagesPath, jsonContent);
	await fs.writeFile(publicImagesPath, jsonContent);

	// Clear the images cache
	await clearImagesCache();

	return NextResponse.json({
		success: true,
		message: `ซิงค์รูปภาพสำเร็จ (filename-based) พบรูปภาพรวม ${
			Object.keys(allImagesData).length
		} รูป (ใหม่: ${newImagesCount}) ${forceUpdate ? "(Force Update)" : ""}`,
		dataStructure: "filename-based",
		newImages: newImagesCount,
		totalImages: Object.keys(allImagesData).length,
		forceUpdate: forceUpdate,
	});
}

/**
 * Traditional ID-based sync (existing functionality)
 */
async function syncWithIdBasedStructure(
	srcImagesPath: string,
	publicImagesPath: string,
	forceUpdate: boolean = false
) {
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

	// Clear the images cache
	await clearImagesCache();

	return NextResponse.json({
		success: true,
		message: `ซิงค์รูปภาพสำเร็จ (ID-based) พบรูปภาพรวม ${allImages.length} รูป (เก่า: ${existingImages.length}, ใหม่จาก GCS: ${newGcsImages.length})`,
		dataStructure: "id-based",
		gcsImageCount: newGcsImages.length,
		totalImages: allImages.length,
	});
}

export async function POST(request: NextRequest) {
	// Same as GET for convenience
	return GET(request);
}
