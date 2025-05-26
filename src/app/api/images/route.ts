import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { LRUCache } from "lru-cache";

interface ImageData {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	category?: string;
	tags?: string[];
	day?: number;
	uploadDate?: string;
	gcsPath?: string;
	isHighlight?: boolean;
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
 * - category (optional): Filter by category
 * - tags (optional): Filter by tags, comma-separated
 * - sortBy (optional): Field to sort by (date, id, day)
 * - sortOrder (optional): Sort direction (asc, desc)
 * - search (optional): Search query for title, category, tags
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "100"); // Default to 100 for better performance
		const day = searchParams.get("day")
			? parseInt(searchParams.get("day")!)
			: null;
		const category = searchParams.get("category");
		const tags = searchParams.get("tags")?.split(",");
		const sortBy = searchParams.get("sortBy") || "date"; // date, id, day
		const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
		const search = searchParams.get("search") || "";

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
				allImages = JSON.parse(fileContent);

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

		// Filter by category
		if (category) {
			filteredImages = filteredImages.filter(
				(img) => img.category?.toLowerCase() === category.toLowerCase()
			);
		}

		// Filter by tags
		if (tags && tags.length > 0) {
			filteredImages = filteredImages.filter((img) =>
				tags.some((tag) => img.tags?.includes(tag))
			);
		}

		// Filter by search term
		if (search) {
			const searchLower = search.toLowerCase();
			filteredImages = filteredImages.filter(
				(img) =>
					img.title?.toLowerCase().includes(searchLower) ||
					img.category?.toLowerCase().includes(searchLower) ||
					img.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
			);
		}

		// Sort images based on parameters
		filteredImages.sort((a, b) => {
			// Determine which fields to compare based on sortBy
			let valueA: any;
			let valueB: any;

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
