import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { LRUCache } from "lru-cache";

interface ImageData {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	day?: number;
	uploadDate?: string;
	gcsPath?: string;
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
	dimensions?: {
		width: number;
		height: number;
	};
}

// Server-side LRU cache for images data
// This will persist across requests but not across server restarts
const imagesCache = new LRUCache<
	string,
	{
		data: ImageData[];
		timestamp: number;
	}
>({
	max: 50, // Maximum number of cache entries
	ttl: 1000 * 60 * 15, // 15 minutes in milliseconds
	updateAgeOnGet: true, // Extends TTL when accessed
});

// Cache for processed results (after filtering, sorting, etc.)
const resultCache = new LRUCache<
	string,
	{
		data: { images: ImageData[]; totalImages: number };
		timestamp: number;
	}
>({
	max: 200, // Store more query results
	ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
});

/**
 * GET route for paginated image retrieval
 * Query parameters:
 * - page (default: 1): The page number to retrieve
 * - limit (default: 100): Number of images per page
 * - day (optional): Filter by specific day
 * - sortBy (optional): Field to sort by (date, id, day)
 * - sortOrder (optional): Sort direction (asc, desc)
 * - search (optional): Search query for title
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "100"); // Default to 100 for better performance
		const day = searchParams.get("day")
			? parseInt(searchParams.get("day")!)
			: null;
		const sortBy = searchParams.get("sortBy") || "date"; // date, id, day
		const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc

		// Cache control for better performance
		const cacheControl = request.headers.get("cache-control") || "";
		const noCache =
			cacheControl.includes("no-cache") || searchParams.has("refresh");

		// Create a cache key based on the query parameters that affect the result
		const cacheKey = `images-${searchParams.toString()}`;

		// Check result cache first for this specific query
		if (!noCache) {
			const cachedResult = resultCache.get(cacheKey);
			if (cachedResult) {
				// Add cache headers to response
				return NextResponse.json(cachedResult.data, {
					headers: {
						"Cache-Control": "max-age=300, stale-while-revalidate=600",
						"X-Cache": "HIT",
						"X-Cache-Age": `${Math.floor(
							(Date.now() - cachedResult.timestamp) / 1000
						)}s`,
					},
				});
			}
		}

		// Read images from file with caching
		const srcImagesPath = path.join(process.cwd(), "src/data/images.json");

		let allImages: ImageData[] = [];

		// Try to get images from the cache first
		const cacheImageKey = "all-images";
		const cachedImages = !noCache ? imagesCache.get(cacheImageKey) : null;

		if (cachedImages) {
			allImages = cachedImages.data;
		} else {
			// Cache miss, read from file
			try {
				const fileContent = await fs.readFile(srcImagesPath, "utf8");
				const rawData = JSON.parse(fileContent);

				// Detect data format and convert if necessary
				if (isFilenameBasedData(rawData)) {
					// Convert filename-based data to ID-based format
					allImages = convertFilenameDataToIdBased(rawData);
					console.log(
						`Converted ${allImages.length} filename-based images to ID format`
					);
				} else if (Array.isArray(rawData)) {
					// Already in ID-based format
					allImages = rawData as ImageData[];
				} else {
					console.warn("Unknown data format in images.json, treating as empty");
					allImages = [];
				}

				// Update the cache
				imagesCache.set(cacheImageKey, {
					data: allImages,
					timestamp: Date.now(),
				});
			} catch (error) {
				console.error("Error reading images file:", error);
				return NextResponse.json(
					{ error: "Failed to read images data" },
					{ status: 500 }
				);
			}
		}

		// Apply filters
		let filteredImages = [...allImages];

		// Filter by day
		if (day !== null) {
			filteredImages = filteredImages.filter((img) => img.day === day);
		}

		// Sort images based on parameters
		filteredImages.sort((a, b) => {
			// Determine which fields to compare based on sortBy
			let valueA: number;
			let valueB: number;

			switch (sortBy) {
				case "id":
					valueA = a.id;
					valueB = b.id;
					break;
				case "day":
					valueA = a.day || 0;
					valueB = b.day || 0;
					break;
				case "date":
				default:
					valueA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
					valueB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
					break;
			}

			// Apply sort order
			if (sortOrder === "asc") {
				return valueA - valueB;
			} else {
				return valueB - valueA;
			}
		});

		// Track total images count before pagination
		const totalImages = filteredImages.length;

		// Apply pagination - optimize for large collections
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedImages = filteredImages.slice(startIndex, endIndex);

		// Return response with cache headers
		const result = {
			images: paginatedImages,
			totalImages,
			currentPage: page,
			totalPages: Math.ceil(totalImages / limit),
			hasMore: endIndex < totalImages,
		};

		// Store result in cache
		resultCache.set(cacheKey, {
			data: result,
			timestamp: Date.now(),
		});

		return NextResponse.json(result, {
			headers: {
				"Cache-Control": "max-age=300, stale-while-revalidate=600",
				"X-Cache": "MISS",
			},
		});
	} catch (error) {
		console.error("Error retrieving images:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve images" },
			{ status: 500 }
		);
	}
}

/**
 * POST route for clearing the images cache
 * This should be called after image uploads, deletions, or updates
 */
export async function POST() {
	try {
		// Clear both caches
		imagesCache.clear();
		resultCache.clear();

		console.log("Images cache cleared");

		return NextResponse.json({
			success: true,
			message: "Images cache cleared successfully",
		});
	} catch (error) {
		console.error("Error clearing cache:", error);
		return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
	}
}

/**
 * Convert filename-based data structure to ID-based format for backward compatibility
 */
function convertFilenameDataToIdBased(
	filenameData: Record<string, ImageDataByFilename>
): ImageData[] {
	return Object.values(filenameData).map((item, index) => ({
		id: index + 1, // Generate sequential IDs for display
		thumbnailUrl: item.thumbnailUrl,
		fullUrl: item.fullUrl,
		title: item.title,
		day: item.day,
		uploadDate: item.uploadDate,
		gcsPath: item.gcsPath,
	}));
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
