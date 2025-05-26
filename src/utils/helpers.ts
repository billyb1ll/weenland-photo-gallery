// Utility functions for the photo gallery application

import { ImageData } from "../types";

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Generate a unique ID for images
 */
export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Filter images based on search term and category
 */
export function filterImages(
	images: ImageData[],
	searchTerm: string,
	category: string
): ImageData[] {
	return images.filter((image) => {
		const matchesSearch =
			!searchTerm ||
			image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			image.tags.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase())
			);

		const matchesCategory =
			!category || category === "all" || image.category === category;

		return matchesSearch && matchesCategory;
	});
}

/**
 * Sort images by various criteria
 */
export function sortImages(
	images: ImageData[],
	sortBy: "date" | "title" | "category",
	order: "asc" | "desc" = "desc"
): ImageData[] {
	return [...images].sort((a, b) => {
		let comparison = 0;

		switch (sortBy) {
			case "date":
				comparison =
					new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
				break;
			case "title":
				comparison = a.title.localeCompare(b.title);
				break;
			case "category":
				comparison = a.category.localeCompare(b.category);
				break;
		}

		return order === "asc" ? comparison : -comparison;
	});
}

/**
 * Extract unique categories from images
 */
export function getUniqueCategories(images: ImageData[]): string[] {
	const categories = images.map((image) => image.category);
	return [...new Set(categories)].sort();
}

/**
 * Extract unique tags from images
 */
export function getUniqueTags(images: ImageData[]): string[] {
	const tags = images.flatMap((image) => image.tags);
	return [...new Set(tags)].sort();
}

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
	const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	return validTypes.includes(file.type);
}

/**
 * Create a download URL for blob data
 */
export function createDownloadUrl(blob: Blob, filename: string): string {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
	return url;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}
