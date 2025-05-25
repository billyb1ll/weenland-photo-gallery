import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { downloadImageFromGCS } from "@/lib/storage";

interface ImageData {
	id: number;
	fullUrl: string;
	title: string;
	day?: number;
	gcsPath?: string;
}

export async function POST(request: NextRequest) {
	try {
		const { images } = await request.json();

		if (!images || !Array.isArray(images) || images.length === 0) {
			return NextResponse.json({ error: "No images provided" }, { status: 400 });
		}

		const zip = new JSZip();
		let totalImagesAdded = 0;

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
				const { fullUrl, title, id, gcsPath } = dayImages[i];

				try {
					console.log(`Attempting to download: ${fullUrl}`);
					let imageBlob: ArrayBuffer;

					// If it's a GCS image, download directly from GCS
					if (gcsPath) {
						console.log(`Downloading from GCS: ${gcsPath}`);
						const buffer = await downloadImageFromGCS(gcsPath);
						imageBlob = buffer.buffer.slice(
							buffer.byteOffset,
							buffer.byteOffset + buffer.byteLength
						) as ArrayBuffer;
						console.log(`Downloaded GCS image size: ${imageBlob.byteLength} bytes`);
					} else {
						// For Lorem Picsum URLs, use fetch with improved error handling
						const controller = new AbortController();
						const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

						const response = await fetch(fullUrl, {
							method: "GET",
							headers: {
								"User-Agent":
									"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
								Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
								"Accept-Encoding": "gzip, deflate, br",
								"Accept-Language": "en-US,en;q=0.9",
								"Cache-Control": "no-cache",
								Pragma: "no-cache",
							},
							redirect: "follow", // Follow redirects for Lorem Picsum
							signal: controller.signal,
						});

						clearTimeout(timeoutId);
						console.log(
							`Response status for ${fullUrl}:`,
							response.status,
							response.statusText
						);
						console.log(`Final URL after redirects:`, response.url);

						if (!response.ok) {
							console.error(
								`Failed to download image ${fullUrl}: ${response.status} ${response.statusText}`
							);
							continue;
						}

						imageBlob = await response.arrayBuffer();
						console.log(`Downloaded URL image size: ${imageBlob.byteLength} bytes`);
					}

					if (imageBlob.byteLength === 0) {
						console.error(`Downloaded image is empty for ${fullUrl || gcsPath}`);
						continue;
					}

					// Determine file extension
					let fileExtension = "jpg";

					if (gcsPath) {
						// Extract extension from GCS path
						const pathExtension = gcsPath.split(".").pop()?.toLowerCase();
						if (
							pathExtension &&
							["jpg", "jpeg", "png", "webp", "gif"].includes(pathExtension)
						) {
							fileExtension = pathExtension;
						}
					} else {
						// For Lorem Picsum, default to jpg
						fileExtension = "jpg";
					}

					// Use image ID and clean title for filename
					const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
					const fileName = `${id}_${cleanTitle}.${fileExtension}`;

					dayZipFolder.file(fileName, imageBlob);
					totalImagesAdded++;
					console.log(
						`Successfully added ${fileName} to ZIP (${imageBlob.byteLength} bytes)`
					);
				} catch (error) {
					console.error(`Error downloading image ${fullUrl}:`, error);
					// Continue with other images even if one fails
				}
			}
		}

		// Check if any images were successfully added
		if (totalImagesAdded === 0) {
			return NextResponse.json(
				{ error: "No images could be downloaded. Please try again later." },
				{ status: 500 }
			);
		}

		console.log(`Total images added to ZIP: ${totalImagesAdded}`);

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
