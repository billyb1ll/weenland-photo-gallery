/**
 * Memory management utilities for optimizing large image collections
 */

interface MemoryStats {
	totalJSHeapSize?: number;
	usedJSHeapSize?: number;
	jsHeapSizeLimit?: number;
	percentUsed?: number;
	isPerformanceSupported: boolean;
}

/**
 * Get memory usage statistics if available
 * @returns Memory statistics object
 */
export function getMemoryStats(): MemoryStats {
	if (typeof window === "undefined") {
		return { isPerformanceSupported: false };
	}

	// Check if performance.memory is available (Chrome/Edge only)
	const performance = window.performance as any;
	if (!performance || !performance.memory) {
		return { isPerformanceSupported: false };
	}

	const { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit } =
		performance.memory;

	return {
		totalJSHeapSize,
		usedJSHeapSize,
		jsHeapSizeLimit,
		percentUsed: (usedJSHeapSize / jsHeapSizeLimit) * 100,
		isPerformanceSupported: true,
	};
}

/**
 * Check if memory usage is high and cleanup might be needed
 * @param threshold Percentage threshold (0-100) to consider memory usage high
 * @returns Boolean indicating if memory usage is high
 */
export function isMemoryUsageHigh(threshold = 70): boolean {
	const stats = getMemoryStats();
	if (!stats.isPerformanceSupported || !stats.percentUsed) {
		return false;
	}

	return stats.percentUsed > threshold;
}

/**
 * Image sources cache to manage loaded images
 */
const loadedImageSources = new Map<
	string,
	{
		lastUsed: number;
		priority: number;
	}
>();

/**
 * Track an image as being viewed or used
 * @param url Image URL
 * @param priority Priority level (higher numbers = higher priority)
 */
export function trackImageUsage(url: string, priority = 1): void {
	loadedImageSources.set(url, {
		lastUsed: Date.now(),
		priority,
	});
}

/**
 * Unload images that haven't been used recently to free memory
 * @param olderThan Time in milliseconds to consider an image old
 * @param priorityThreshold Only unload images with priority below this threshold
 * @returns Number of images unloaded
 */
export function unloadUnusedImages(
	olderThan = 5 * 60 * 1000, // 5 minutes default
	priorityThreshold = 2
): number {
	const now = Date.now();
	let unloadedCount = 0;

	// Only proceed if memory usage is high or we have many images loaded
	if (!isMemoryUsageHigh() && loadedImageSources.size < 200) {
		return 0;
	}

	// Find URLs to unload
	const urlsToUnload: string[] = [];

	loadedImageSources.forEach((data, url) => {
		if (now - data.lastUsed > olderThan && data.priority < priorityThreshold) {
			urlsToUnload.push(url);
		}
	});

	// Remove from tracking
	urlsToUnload.forEach((url) => {
		loadedImageSources.delete(url);
		unloadedCount++;
	});

	// Force garbage collection on supported browsers
	if (unloadedCount > 0 && typeof window !== "undefined") {
		// Use small timeout to allow browser to process other tasks first
		setTimeout(() => {
			if (window.gc) {
				window.gc();
			} else if ((window as any).CollectGarbage) {
				(window as any).CollectGarbage();
			}
		}, 100);
	}

	return unloadedCount;
}

/**
 * Periodically clean up unused images to manage memory
 * @param interval Time in milliseconds between cleanup runs
 * @returns Cleanup interval ID
 */
export function startPeriodicImageCleanup(
	interval = 60 * 1000
): NodeJS.Timeout {
	return setInterval(() => {
		unloadUnusedImages();
	}, interval);
}

/**
 * Stop the periodic cleanup
 * @param intervalId Interval ID returned from startPeriodicImageCleanup
 */
export function stopPeriodicImageCleanup(intervalId: NodeJS.Timeout): void {
	clearInterval(intervalId);
}

/**
 * Get the current image cache status
 * @returns Statistics about the image cache
 */
export function getImageCacheStats() {
	return {
		totalTrackedImages: loadedImageSources.size,
		memoryStats: getMemoryStats(),
	};
}
