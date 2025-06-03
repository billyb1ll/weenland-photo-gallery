/**
 * ID Generation Utility for Weenland Photo Gallery
 *
 * Generates IDs in format: YYMMDD[day]##
 * Where YY=year, MM=month, DD=day, [day]=gallery day number (1-9), ##=sequential number (01-99)
 *
 * Examples:
 * - 250524101 = May 24, 2025, gallery day 1, first image
 * - 250524102 = May 24, 2025, gallery day 1, second image
 * - 250524301 = May 24, 2025, gallery day 3, first image
 */

export interface ImageRecord {
	id: number;
	day?: number;
	uploadDate: string;
	[key: string]: any;
}

/**
 * Generate a date-based ID in format YYMMDD[day]##
 * @param existingImages - Array of existing images to check for ID conflicts
 * @param galleryDay - Gallery day number (1, 2, 3, etc.)
 * @param uploadDate - Optional upload date (defaults to now)
 * @returns New unique ID in YYMMDD[day]## format
 */
export function generateDateBasedId(
	existingImages: ImageRecord[] = [],
	galleryDay: number = 1,
	uploadDate?: Date
): number {
	const date = uploadDate || new Date();

	// Format: YYMMDD
	const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
	const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 01-12
	const day = date.getDate().toString().padStart(2, "0"); // 01-31

	// Validate gallery day (1-9)
	if (galleryDay < 1 || galleryDay > 9) {
		throw new Error(`Gallery day must be between 1 and 9, got: ${galleryDay}`);
	}

	const datePrefix = `${year}${month}${day}${galleryDay}`;

	// Find existing IDs with the same date and gallery day prefix
	const sameDayIds = existingImages
		.map((img) => img.id)
		.filter((id) => {
			const idStr = id.toString();
			return idStr.length === 9 && idStr.startsWith(datePrefix);
		})
		.map((id) => {
			// Extract the sequential number (last 2 digits)
			const idStr = id.toString();
			return parseInt(idStr.slice(-2));
		})
		.sort((a, b) => a - b);

	// Find the next available sequential number
	let sequential = 1;
	for (const existingSeq of sameDayIds) {
		if (existingSeq === sequential) {
			sequential++;
		} else {
			break;
		}
	}

	// Ensure we don't exceed 99 images per gallery day
	if (sequential > 99) {
		throw new Error(
			`Maximum images per gallery day (99) exceeded for ${datePrefix}`
		);
	}

	// Format: YYMMDD[day] + 2-digit sequential number
	const sequentialStr = sequential.toString().padStart(2, "0");
	const newId = parseInt(`${datePrefix}${sequentialStr}`);

	return newId;
}

/**
 * Parse a date-based ID to extract date components
 * @param id - ID in YYMMDD[day]## format
 * @returns Parsed date information or null if invalid format
 */
export function parseDateBasedId(id: number | undefined): {
	year: number;
	month: number;
	day: number;
	galleryDay: number;
	sequential: number;
	date: Date;
} | null {
	// Handle undefined or null values
	if (id === undefined || id === null) {
		return null;
	}

	const idStr = id.toString();

	// Validate format: should be 9 digits
	if (idStr.length !== 9 || !/^\d{9}$/.test(idStr)) {
		return null;
	}

	try {
		const year = 2000 + parseInt(idStr.slice(0, 2)); // YY -> 20YY
		const month = parseInt(idStr.slice(2, 4)); // MM
		const day = parseInt(idStr.slice(4, 6)); // DD
		const galleryDay = parseInt(idStr.slice(6, 7)); // [day]
		const sequential = parseInt(idStr.slice(7, 9)); // ##

		// Validate date components
		if (
			month < 1 ||
			month > 12 ||
			day < 1 ||
			day > 31 ||
			galleryDay < 1 ||
			galleryDay > 9
		) {
			return null;
		}

		const date = new Date(year, month - 1, day);

		// Verify the date is valid (handles invalid dates like Feb 30)
		if (
			date.getFullYear() !== year ||
			date.getMonth() !== month - 1 ||
			date.getDate() !== day
		) {
			return null;
		}

		return {
			year,
			month,
			day,
			galleryDay,
			sequential,
			date,
		};
	} catch (error) {
		return null;
	}
}

/**
 * Check if an ID follows the new date-based format
 * @param id - ID to check
 * @returns true if ID is in YYMMDD[day]## format
 */
export function isDateBasedId(id: number | undefined): boolean {
	if (id === undefined || id === null) {
		return false;
	}
	return parseDateBasedId(id) !== null;
}

/**
 * Convert a timestamp ID to a human-readable format
 * @param id - Either timestamp or date-based ID
 * @returns Human-readable string
 */
export function formatIdForDisplay(id: number): string {
	const parsed = parseDateBasedId(id);
	if (parsed) {
		const dateStr = parsed.date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		return `${dateStr} Day ${parsed.galleryDay} #${parsed.sequential}`;
	}

	// Fallback for timestamp IDs
	if (id > 1000000000000) {
		// Looks like a timestamp
		const date = new Date(id);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	return `ID: ${id}`;
}

/**
 * Migrate existing timestamp IDs to date-based IDs
 * @param images - Array of images with potentially mixed ID formats
 * @param galleryDay - Gallery day number for migrated images
 * @returns Updated images with new date-based IDs
 */
export function migrateToDateBasedIds(
	images: ImageRecord[],
	galleryDay: number = 1
): ImageRecord[] {
	const migratedImages: ImageRecord[] = [];

	// Sort by upload date to maintain chronological order
	const sortedImages = [...images].sort((a, b) => {
		const dateA = new Date(a.uploadDate);
		const dateB = new Date(b.uploadDate);
		return dateA.getTime() - dateB.getTime();
	});

	for (const image of sortedImages) {
		// Skip if already using date-based ID or if ID is missing
		if (!image.id) {
			// Generate a new ID for images without an ID
			const uploadDate = new Date(image.uploadDate || new Date());
			const newId = generateDateBasedId(migratedImages, galleryDay, uploadDate);
			migratedImages.push({
				...image,
				id: newId,
			});
			continue;
		}

		if (isDateBasedId(image.id)) {
			migratedImages.push(image);
			continue;
		}

		// Generate new date-based ID based on upload date and gallery day
		const uploadDate = new Date(image.uploadDate);
		const newId = generateDateBasedId(migratedImages, galleryDay, uploadDate);

		migratedImages.push({
			...image,
			originalId: image.id, // Keep original for reference
			id: newId,
		});
	}

	return migratedImages;
}
