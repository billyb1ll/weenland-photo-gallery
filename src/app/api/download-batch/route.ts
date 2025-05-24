import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

interface ImageData {
	id: number;
	fullUrl: string;
	title: string;
	day?: number;
}

export async function POST(request: NextRequest) {
	try {
		const { images } = await request.json();

		if (!images || !Array.isArray(images) || images.length === 0) {
			return NextResponse.json({ error: "No images provided" }, { status: 400 });
		}

		const zip = new JSZip();

		// Group images by day
		const imagesByDay = images.reduce(
			(acc: Record<string, ImageData[]>, image: ImageData) => {
				const day = image.day ? `Day_${image.day}` : "Uncategorized";
				if (!acc[day]) {
					acc[day] = [];
				}
				acc[day].push(image);
				return acc;
			},
			{}
		);

		// Create folders for each day and add images
		for (const [dayFolder, dayImages] of Object.entries(imagesByDay) as [
			string,
			ImageData[]
		][]) {
			const dayZipFolder = zip.folder(dayFolder);

			if (!dayZipFolder) continue;

			for (let i = 0; i < dayImages.length; i++) {
				const { fullUrl, title, id } = dayImages[i];

				try {
					const response = await fetch(fullUrl);
					if (response.ok) {
						const imageBlob = await response.arrayBuffer();
						const fileExtension = fullUrl.split(".").pop() || "jpg";
						// Use image ID and clean title for filename
						const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
						const fileName = `${id}_${cleanTitle}.${fileExtension}`;

						dayZipFolder.file(fileName, imageBlob);
					}
				} catch (error) {
					console.warn(`Failed to download image: ${fullUrl}`, error);
					// Continue with other images even if one fails
				}
			}
		}

		// Generate ZIP file
		const zipBlob = await zip.generateAsync({
			type: "arraybuffer",
			compression: "DEFLATE",
			compressionOptions: {
				level: 6,
			},
		});

		// Create filename with timestamp
		const timestamp = new Date().toISOString().split("T")[0];
		const filename = `weenland-gallery-${timestamp}.zip`;

		// Return ZIP file as response
		return new NextResponse(zipBlob, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Content-Length": zipBlob.byteLength.toString(),
			},
		});
	} catch (error) {
		console.error("Error creating ZIP file:", error);
		return NextResponse.json(
			{ error: "Failed to create ZIP file" },
			{ status: 500 }
		);
	}
}
