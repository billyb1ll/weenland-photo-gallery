/**
 * Utility for pre-loading images to improve user experience when browsing large collections
 */

// Cache for tracking which images have been preloaded
const preloadedImages = new Set<string>();

// Maximum number of concurrent preloads to avoid overwhelming the browser
const MAX_CONCURRENT_PRELOADS = 8;

/**
 * Preload an image by creating a new Image object and setting its src
 * @param url Image URL to preload
 * @returns Promise that resolves when image is loaded or rejects on error
 */
export function preloadImage(url: string): Promise<void> {
	// Skip if already preloaded
	if (preloadedImages.has(url)) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			preloadedImages.add(url);
			resolve();
		};

		img.onerror = () => {
			reject(new Error(`Failed to preload image: ${url}`));
		};

		// Set source after adding event listeners
		img.src = url;
	});
}

/**
 * Preload a batch of images with concurrency control
 * @param urls Array of image URLs to preload
 * @param options Configuration options
 * @returns Promise that resolves when all images are loaded
 */
export async function preloadImageBatch(
	urls: string[],
	options: {
		concurrency?: number;
		priority?: "high" | "low";
		signal?: AbortSignal;
	} = {}
): Promise<void> {
	const {
		concurrency = MAX_CONCURRENT_PRELOADS,
		priority = "high",
		signal,
	} = options;

	// Filter out already preloaded images
	const urlsToLoad = urls.filter((url) => !preloadedImages.has(url));

	if (urlsToLoad.length === 0) {
		return Promise.resolve();
	}

	// For high priority, use Promise.all with limited concurrency
	// For low priority, use requestIdleCallback if available
	if (priority === "high") {
		// Process in batches to control concurrency
		for (let i = 0; i < urlsToLoad.length; i += concurrency) {
			if (signal?.aborted) {
				break;
			}

			const batch = urlsToLoad.slice(i, i + concurrency);
			await Promise.allSettled(batch.map((url) => preloadImage(url)));
		}
	} else {
		// Low priority - use requestIdleCallback if available or setTimeout
		const preloadLowPriority = (index: number) => {
			if (signal?.aborted || index >= urlsToLoad.length) {
				return;
			}

			const url = urlsToLoad[index];

			const scheduleNext = () => {
				if ("requestIdleCallback" in window) {
					(window as any).requestIdleCallback(() => preloadLowPriority(index + 1), {
						timeout: 1000,
					});
				} else {
					setTimeout(() => preloadLowPriority(index + 1), 50);
				}
			};

			preloadImage(url).finally(scheduleNext);
		};

		// Start the low-priority preloading
		preloadLowPriority(0);
	}
}

/**
 * Clear the preload cache (useful for memory management)
 */
export function clearPreloadCache(): void {
	preloadedImages.clear();
}

/**
 * Preload images for the next and previous days to enable smooth navigation
 * @param currentDay Current day being viewed
 * @param availableDays Array of all available days
 * @param getImagesForDay Function to get image URLs for a given day
 * @param signal AbortSignal to cancel preloading
 */
export async function preloadAdjacentDays(
	currentDay: number | null,
	availableDays: number[],
	getImagesForDay: (day: number) => Promise<string[]>,
	signal?: AbortSignal
): Promise<void> {
	if (currentDay === null || availableDays.length === 0) {
		return;
	}

	// Find the index of the current day
	const currentIndex = availableDays.indexOf(currentDay);
	if (currentIndex === -1) {
		return;
	}

	// Determine next and previous days
	const nextDay = availableDays[currentIndex + 1];
	const prevDay = availableDays[currentIndex - 1];

	const daysToPreload: number[] = [];

	if (nextDay !== undefined) {
		daysToPreload.push(nextDay);
	}

	if (prevDay !== undefined) {
		daysToPreload.push(prevDay);
	}

	// Preload thumbnails for adjacent days
	for (const day of daysToPreload) {
		if (signal?.aborted) {
			break;
		}

		try {
			const urls = await getImagesForDay(day);
			await preloadImageBatch(urls.slice(0, 20), {
				priority: "low",
				signal,
			});
		} catch (error) {
			console.error(`Error preloading day ${day}:`, error);
		}
	}
}
