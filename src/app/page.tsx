"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import GalleryCard from "@/components/GalleryCard";
import AdminGalleryCard from "@/components/AdminGalleryCard";
import Lightbox from "@/components/OptimizedLightbox";
import DayNavigationWithFeatures from "@/components/DayNavigationWithFeatures";
import OptimizedAdminNavBar from "@/components/OptimizedAdminNavBar";
import LoadingPopup from "@/components/LoadingPopup";
import VirtualizedGrid from "@/components/VirtualizedGrid";
import SearchFilterBar from "@/components/SearchFilterBar";
import { preloadImageBatch, clearPreloadCache } from "@/lib/image-preloader";
import {
	trackImageUsage,
	unloadUnusedImages,
	startPeriodicImageCleanup,
	stopPeriodicImageCleanup,
	getMemoryStats,
} from "@/lib/memory-manager";

interface ImageData {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	day?: number;
	uploadDate?: string;
	isHighlight?: boolean;
	filename?: string; // For filename-based operations
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
	isHighlight?: boolean;
}

export default function Home() {
	const [images, setImages] = useState<ImageData[]>([]);
	const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
	const [favorites, setFavorites] = useState<Set<number>>(new Set());
	const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [lightboxImageId, setLightboxImageId] = useState<number | null>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState<number | undefined>(
		undefined
	);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalImages, setTotalImages] = useState(0);
	const [loadingError, setLoadingError] = useState<string | null>(null);
	const [optimizationInfo, setOptimizationInfo] = useState({
		totalImages: 0,
		cachedImages: 0,
		memoryUsage: 0,
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [batchMode, setBatchMode] = useState(false);
	const [slideshowMode, setSlideshowMode] = useState(false);
	const [slideshowInterval, setSlideshowInterval] = useState(5000); // 5 seconds
	const [sortOrder, setSortOrder] = useState<
		"date-newest" | "date-oldest" | "name-asc" | "name-desc"
	>("date-newest");

	// References for optimization
	const loadingRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const preloadAbortControllerRef = useRef<AbortController | null>(null);
	const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Reference for caching day images to avoid redundant fetches
	const dayImagesCache = useRef<Record<number, ImageData[]>>({});

	// Helper function to determine if data is filename-based
	const isFilenameBasedData = useCallback((data: unknown[]): boolean => {
		if (!Array.isArray(data) || data.length === 0) return false;
		const firstItem = data[0] as Record<string, unknown>;
		return (
			typeof firstItem.filename === "string" &&
			typeof firstItem.gcsPath === "string" &&
			!firstItem.hasOwnProperty("id")
		);
	}, []);

	// Helper function to convert filename-based data to ID-based format for frontend compatibility
	const convertFilenameDataToImageData = useCallback(
		(filenameData: ImageDataByFilename[]): ImageData[] => {
			return filenameData.map((item, index) => ({
				id: index + 1, // Generate sequential IDs for frontend
				thumbnailUrl: item.thumbnailUrl,
				fullUrl: item.fullUrl,
				title: item.title,
				day: item.day,
				uploadDate: item.uploadDate,
				isHighlight: item.isHighlight,
				filename: item.filename, // Keep filename for backend operations
			}));
		},
		[]
	);

	// Helper function to process API response data (handles both formats)
	const processImageData = useCallback(
		(data: { images: unknown[]; [key: string]: unknown }): ImageData[] => {
			if (!data.images || !Array.isArray(data.images)) {
				return [];
			}

			// Check if data is filename-based and convert if needed
			if (isFilenameBasedData(data.images)) {
				console.log(
					"Processing filename-based data, converting to ID format for frontend"
				);
				return convertFilenameDataToImageData(data.images as ImageDataByFilename[]);
			}

			// Process ID-based data normally
			return data.images.map((img: unknown) => {
				const imageData = img as ImageData;
				return {
					...imageData,
					day: imageData.day || 1,
					uploadDate: imageData.uploadDate || new Date().toISOString(),
				};
			});
		},
		[isFilenameBasedData, convertFilenameDataToImageData]
	);

	// Load favorites from cookies on mount
	useEffect(() => {
		const savedFavorites = document.cookie
			.split("; ")
			.find((row) => row.startsWith("weenland_favorites="))
			?.split("=")[1];

		if (savedFavorites) {
			try {
				const favIds = JSON.parse(decodeURIComponent(savedFavorites));
				setFavorites(new Set(favIds));
			} catch (error) {
				console.error("Error loading favorites from cookies:", error);
			}
		}
	}, []);

	// Save favorites to cookies whenever favorites change
	useEffect(() => {
		const favArray = Array.from(favorites);
		const cookieValue = encodeURIComponent(JSON.stringify(favArray));
		const expiryDate = new Date();
		expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

		document.cookie = `weenland_favorites=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
	}, [favorites]);

	// Filter images based on search and filters
	useEffect(() => {
		let filtered = images;

		// Filter by day
		if (selectedDay !== null) {
			filtered = filtered.filter((img) => img.day === selectedDay);
		}

		// Filter by favorites
		if (showFavoritesOnly) {
			filtered = filtered.filter((img) => favorites.has(img.id));
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const lowercaseQuery = searchQuery.toLowerCase().trim();
			filtered = filtered.filter((image) => {
				// Search by title
				if (image.title && image.title.toLowerCase().includes(lowercaseQuery))
					return true;

				// Search by filename
				if (image.filename && image.filename.toLowerCase().includes(lowercaseQuery))
					return true;

				// Search by date
				if (
					image.uploadDate &&
					image.uploadDate.toLowerCase().includes(lowercaseQuery)
				)
					return true;

				// Search by day
				if (image.day !== undefined && `day ${image.day}`.includes(lowercaseQuery))
					return true;

				return false;
			});
		}

		setFilteredImages(filtered);
	}, [images, selectedDay, showFavoritesOnly, favorites, searchQuery]);

	// Load more images from server with better error handling and abort controller
	const loadMoreImages = useCallback(async () => {
		// Use loadingRef to prevent concurrent loads
		if (loadingRef.current || !hasMore) return;

		// Cancel any previous request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller
		abortControllerRef.current = new AbortController();

		try {
			loadingRef.current = true;

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: "100",
			});

			if (selectedDay !== null) {
				params.append("day", selectedDay.toString());
			}

			const response = await fetch(`/api/images?${params.toString()}`, {
				signal: abortControllerRef.current.signal,
			});

			if (response.ok) {
				const data = await response.json();
				const newImages = processImageData(data);

				setImages((prev) => {
					// Filter out duplicates (by id)
					const existingIds = new Set(prev.map((img) => img.id));
					const uniqueNewImages = newImages.filter(
						(img: ImageData) => !existingIds.has(img.id)
					);
					return [...prev, ...uniqueNewImages];
				});

				setHasMore(data.hasMore);
				setCurrentPage((prev) => prev + 1);
				setLoadingError(null);
			} else {
				const errorData = await response.json();
				setLoadingError(errorData.error || "Failed to load images");
				console.error("Failed to load images:", errorData);
			}
		} catch (error) {
			// Ignore abort errors
			if (error instanceof DOMException && error.name === "AbortError") {
				console.log("Image loading aborted");
				return;
			}

			console.error("Error loading more images:", error);
			setLoadingError("Failed to load images. Please try again.");
		} finally {
			loadingRef.current = false;
			abortControllerRef.current = null;
		}
	}, [currentPage, hasMore, selectedDay, processImageData]);

	// Initialize images by fetching from API with pagination
	useEffect(() => {
		const initImages = async () => {
			setCurrentPage(1);
			setImages([]);
			loadingRef.current = true;

			try {
				// Cancel any previous request
				if (abortControllerRef.current) {
					abortControllerRef.current.abort();
				}

				// Create new abort controller
				abortControllerRef.current = new AbortController();

				const params = new URLSearchParams({
					page: "1",
					limit: "100",
				});

				if (selectedDay !== null) {
					params.append("day", selectedDay.toString());
				}

				const response = await fetch(`/api/images?${params.toString()}`, {
					signal: abortControllerRef.current.signal,
				});

				if (response.ok) {
					const data = await response.json();
					const imagesWithDefaults = data.images.map((img: ImageData) => ({
						...img,
						day: img.day || 1,
						uploadDate: img.uploadDate || new Date().toISOString(),
					}));

					setImages(imagesWithDefaults);
					setTotalImages(data.totalImages);
					setHasMore(data.hasMore);
					setCurrentPage(2); // Next page to load
					setLoadingError(null);
				} else {
					const errorData = await response.json();
					setLoadingError(errorData.error || "Failed to load images");
					console.error("Failed to load images:", errorData);
					setImages([]);
				}
			} catch (error) {
				// Ignore abort errors
				if (error instanceof DOMException && error.name === "AbortError") {
					console.log("Image loading aborted");
					return;
				}

				console.error("Error loading images:", error);
				setLoadingError("Failed to load images. Please try again.");
				setImages([]);
			} finally {
				loadingRef.current = false;
				abortControllerRef.current = null;
			}
		};

		initImages();

		// Cleanup function
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [selectedDay]);

	// Get available days from images
	const availableDays = Array.from(
		new Set(
			images
				.map((img) => img.day)
				.filter((day): day is number => day !== undefined)
		)
	).sort((a, b) => a - b);

	// Handle favorite toggle
	const handleFavoriteToggle = (id: number) => {
		setFavorites((prev) => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(id)) {
				newFavorites.delete(id);
			} else {
				newFavorites.add(id);
			}
			return newFavorites;
		});
	};

	const handleImageSelect = (id: number) => {
		setSelectedImages((prev) => {
			const newSelected = new Set(prev);
			if (newSelected.has(id)) {
				newSelected.delete(id);
			} else {
				newSelected.add(id);
			}
			return newSelected;
		});
	};

	// Track image usage for memory management when viewing images
	const handleImageClick = useCallback(
		(id: number) => {
			// Find the image to get its URL for memory tracking
			const image = images.find((img) => img.id === id);
			if (image) {
				// Track both thumbnail and full image URLs with high priority
				trackImageUsage(image.thumbnailUrl, 3);
				trackImageUsage(image.fullUrl, 3);

				// Trigger memory cleanup if we have too many images
				if (images.length > 1000) {
					setTimeout(() => unloadUnusedImages(), 500);
				}
			}

			// Set the lightbox image
			setLightboxImageId(id);
		},
		[images]
	);

	const handleDownload = (fullUrl: string, filename: string) => {
		try {
			// Create a temporary link element
			const link = document.createElement("a");
			link.href = fullUrl;

			// Determine file extension from URL or default to jpg
			const urlParts = fullUrl.split(".");
			const extension =
				urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : "jpg";

			// Set download filename with proper extension
			link.download = `${filename}.${extension}`;
			link.target = "_blank";
			link.rel = "noopener noreferrer";

			// Temporarily add to DOM and trigger download
			document.body.appendChild(link);
			link.click();

			// Clean up
			setTimeout(() => {
				document.body.removeChild(link);
			}, 100);
		} catch (error) {
			console.error("Download failed:", error);
			// Fallback: open in new tab
			window.open(fullUrl, "_blank", "noopener,noreferrer");
		}
	};

	const handleDownloadSelected = async () => {
		if (selectedImages.size === 0) return;

		setIsDownloading(true);
		setDownloadProgress(0);

		const selectedImageData = images.filter((img) => selectedImages.has(img.id));

		try {
			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setDownloadProgress((prev) => {
					if (prev === undefined) return 10;
					if (prev < 90) return prev + 10;
					return prev;
				});
			}, 300);

			const response = await fetch("/api/download-batch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					images: selectedImageData,
				}),
			});

			clearInterval(progressInterval);
			setDownloadProgress(100);

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = "weenland-gallery-images.zip";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				// Clear selection after successful download
				setSelectedImages(new Set());
			} else {
				console.error("Failed to download ZIP file");
				alert("Failed to download ZIP file. Please try again.");
			}
		} catch (error) {
			console.error("Error downloading ZIP file:", error);
			alert("Error downloading ZIP file. Please try again.");
		} finally {
			// Reset loading state after a brief delay
			setTimeout(() => {
				setIsDownloading(false);
				setDownloadProgress(undefined);
			}, 1000);
		}
	};

	const handleClearSelection = () => {
		setSelectedImages(new Set());
	};

	const handleToggleFavorites = () => {
		setShowFavoritesOnly((prev) => !prev);
	};

	// Handle search input change
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value);
		},
		[]
	);

	// Handle day navigation
	const handleDaySelect = (day: number | null) => {
		// Abort any ongoing preloading
		if (preloadAbortControllerRef.current) {
			preloadAbortControllerRef.current.abort();
			preloadAbortControllerRef.current = null;
		}

		setSelectedDay(day);
	};

	// Handle sort change
	const handleSortChange = (
		sort: "date-newest" | "date-oldest" | "name-asc" | "name-desc"
	) => {
		// Update the sort order state
		setSortOrder(sort);

		// Create a copy of filtered images and sort
		const sortedImages = [...filteredImages];

		switch (sort) {
			case "date-newest":
				sortedImages.sort((a, b) =>
					(b.uploadDate || "").localeCompare(a.uploadDate || "")
				);
				break;
			case "date-oldest":
				sortedImages.sort((a, b) =>
					(a.uploadDate || "").localeCompare(b.uploadDate || "")
				);
				break;
			case "name-asc":
				sortedImages.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
				break;
			case "name-desc":
				sortedImages.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
				break;
		}

		setFilteredImages(sortedImages);
	};

	// Preload images for adjacent days
	useEffect(() => {
		const preloadAdjacentDaysImages = async () => {
			if (selectedDay === null || availableDays.length <= 1) return;

			// Create a new abort controller for this preloading task
			preloadAbortControllerRef.current = new AbortController();
			const signal = preloadAbortControllerRef.current.signal;

			// Find current day index
			const currentDayIndex = availableDays.indexOf(selectedDay);
			if (currentDayIndex === -1) return;

			// Get next and previous days
			const nextDay = availableDays[currentDayIndex + 1];
			const prevDay = availableDays[currentDayIndex - 1];

			// Function to fetch images for a specific day
			const getImagesForDay = async (day: number): Promise<string[]> => {
				// Check if already in cache
				if (dayImagesCache.current[day]) {
					return dayImagesCache.current[day].map((img) => img.thumbnailUrl);
				}

				// Otherwise fetch from API
				try {
					const params = new URLSearchParams({
						page: "1",
						limit: "30", // Just get first batch for preloading
						day: day.toString(),
					});

					const response = await fetch(`/api/images?${params.toString()}`, {
						signal: signal,
					});

					if (response.ok) {
						const data = await response.json();
						const dayImages = data.images.map((img: ImageData) => ({
							...img,
							day: img.day || 1,
							uploadDate: img.uploadDate || new Date().toISOString(),
						}));

						// Cache the day's images
						dayImagesCache.current[day] = dayImages;

						return dayImages.map((img: ImageData) => img.thumbnailUrl);
					}
					return [];
				} catch (error) {
					if (error instanceof DOMException && error.name === "AbortError") {
						console.log("Preloading aborted");
					} else {
						console.error(`Error preloading day ${day}:`, error);
					}
					return [];
				}
			};

			// Preload next and previous day thumbnails
			if (nextDay !== undefined) {
				getImagesForDay(nextDay).then((urls) => {
					if (signal.aborted) return;
					preloadImageBatch(urls, { priority: "low", signal });
				});
			}

			if (prevDay !== undefined) {
				getImagesForDay(prevDay).then((urls) => {
					if (signal.aborted) return;
					preloadImageBatch(urls, { priority: "low", signal });
				});
			}
		};

		// Wait a short time after the current day is loaded before preloading others
		const timeoutId = setTimeout(preloadAdjacentDaysImages, 1000);

		return () => {
			clearTimeout(timeoutId);
			if (preloadAbortControllerRef.current) {
				preloadAbortControllerRef.current.abort();
				preloadAbortControllerRef.current = null;
			}
		};
	}, [selectedDay, availableDays]);

	// Get image counts by day
	const imageCountsByDay = images.reduce((acc, img) => {
		if (img.day !== undefined) {
			acc[img.day] = (acc[img.day] || 0) + 1;
		}
		return acc;
	}, {} as Record<number, number>);

	// Handle admin functions
	const handleAdminLogin = (success: boolean) => {
		setIsLoggedIn(success);
	};

	const handleAdminLogout = () => {
		setIsLoggedIn(false);
	};

	const handleSyncComplete = async () => {
		// Refresh images from the API after upload/sync
		console.log("Sync completed, refreshing images...");

		try {
			// Reset pagination and clear current images
			setCurrentPage(1);
			setImages([]);
			setHasMore(true);
			loadingRef.current = false;

			// Cancel any existing requests
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller
			abortControllerRef.current = new AbortController();

			// Fetch fresh images from API with cache busting
			const params = new URLSearchParams({
				page: "1",
				limit: "100",
				_t: Date.now().toString(), // Cache buster
			});

			if (selectedDay !== null) {
				params.append("day", selectedDay.toString());
			}

			const response = await fetch(`/api/images?${params.toString()}`, {
				signal: abortControllerRef.current.signal,
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			});

			if (response.ok) {
				const data = await response.json();
				const newImages = data.images.map((img: ImageData) => ({
					...img,
					day: img.day || 1,
					uploadDate: img.uploadDate || new Date().toISOString(),
				}));

				setImages(newImages);
				setTotalImages(data.totalImages);
				setHasMore(data.hasMore);
				setCurrentPage(2); // Set to page 2 since we loaded page 1
				setLoadingError(null);
				console.log(
					`Images refreshed successfully: ${newImages.length} images loaded`
				);
			} else {
				console.error("Failed to fetch updated images from API");
				// Fallback to page reload
				window.location.reload();
			}
		} catch (error) {
			// Ignore abort errors
			if (error instanceof DOMException && error.name === "AbortError") {
				console.log("Image refresh aborted");
				return;
			}

			console.error("Error refreshing images:", error);
			// Fallback to page reload
			window.location.reload();
		} finally {
			abortControllerRef.current = null;
		}
	};

	// Admin image management functions with dual-format support
	const handleUpdateImage = async (
		id: number,
		updates: {
			day?: number;
			title?: string;
			isHighlight?: boolean;
		}
	) => {
		try {
			// First, check if we have filename for this image
			const image = images.find((img) => img.id === id);
			const useFilename = image?.filename;

			const response = await fetch("/api/images/update", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(
					useFilename
						? {
								filename: useFilename,
								...updates,
						  }
						: {
								imageId: id,
								...updates,
						  }
				),
			});

			if (response.ok) {
				// Refresh images after successful update
				await handleSyncComplete();
			} else {
				console.error("Failed to update image");
				alert("Failed to update image. Please try again.");
			}
		} catch (error) {
			console.error("Error updating image:", error);
			alert("Error updating image. Please try again.");
		}
	};

	const handleDeleteImage = async (id: number) => {
		if (
			!confirm(
				"Are you sure you want to delete this image? This action cannot be undone."
			)
		) {
			return;
		}

		try {
			// First, check if we have filename for this image
			const image = images.find((img) => img.id === id);
			const useFilename = image?.filename;

			const response = await fetch("/api/images/delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(
					useFilename
						? {
								filename: useFilename,
						  }
						: {
								imageId: id,
						  }
				),
			});

			if (response.ok) {
				// Refresh images after successful deletion
				await handleSyncComplete();
			} else {
				console.error("Failed to delete image");
				alert("Failed to delete image. Please try again.");
			}
		} catch (error) {
			console.error("Error deleting image:", error);
			alert("Error deleting image. Please try again.");
		}
	};

	// Setup memory management for large image collections
	useEffect(() => {
		// Start periodic cleanup for memory management
		cleanupIntervalRef.current = startPeriodicImageCleanup(90 * 1000); // Run every 90 seconds

		// Clean up on component unmount
		return () => {
			if (cleanupIntervalRef.current) {
				stopPeriodicImageCleanup(cleanupIntervalRef.current);
				cleanupIntervalRef.current = null;
			}

			// Final cleanup before unmount
			unloadUnusedImages(0, 0); // Unload all tracked images
			clearPreloadCache();
		};
	}, []);

	// Update optimization info periodically
	useEffect(() => {
		if (!isLoggedIn) return; // Only track when admin is logged in

		const updateStats = () => {
			const memStats = getMemoryStats();
			const cachedImgCount = Object.keys(dayImagesCache.current).reduce(
				(total, day) => total + dayImagesCache.current[parseInt(day)].length,
				0
			);

			setOptimizationInfo({
				totalImages: images.length,
				cachedImages: cachedImgCount,
				memoryUsage: memStats.percentUsed || 0,
			});
		};

		// Update immediately and then every 10 seconds
		updateStats();
		const interval = setInterval(updateStats, 10000);

		return () => clearInterval(interval);
	}, [isLoggedIn, images.length]);

	// Remove the duplicate handleImageView and handleImageClick declarations

	// Removed duplicate optimizationInfo declaration and effect
	// The original declaration and effect are kept at lines ~50-80

	return (
		<div className="min-h-screen bg-white relative">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-plum-purple/5 to-honey-yellow/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-honey-yellow/8 to-plum-purple/5 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-plum-purple/3 to-honey-yellow/5 rounded-full blur-3xl"></div>
			</div>

			{/* Admin Navigation Bar */}
			<OptimizedAdminNavBar
				isLoggedIn={isLoggedIn}
				onLogin={handleAdminLogin}
				onLogout={handleAdminLogout}
				images={images}
				onImagesUpdate={handleSyncComplete}
				selectedDay={selectedDay}
				optimizationInfo={optimizationInfo}
			/>

			<div className={`relative z-10 ${isLoggedIn ? "pt-0" : ""}`}>
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
					{/* Header */}
					<header className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight">
							<span
								className="text-plum-purple bg-gradient-to-r from-plum-purple via-purple-600 to-honey-yellow bg-clip-text"
								style={{
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
								}}>
								WEENLAND
							</span>
							<br />
							<span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-gray-700">
								Photo Gallery
							</span>
						</h1>
						<p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light max-w-2xl mx-auto px-4">
							Discover beautiful moments captured in time
						</p>
						<div className="mt-6 sm:mt-8 flex justify-center">
							<div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-transparent via-plum-purple/50 to-transparent rounded-full"></div>
						</div>
					</header>

					{/* Combined Day Navigation and Features */}
					<div className="animate-slide-in-left">
						<DayNavigationWithFeatures
							selectedDay={selectedDay}
							availableDays={availableDays}
							onDaySelect={handleDaySelect}
							imageCountsByDay={imageCountsByDay}
							selectedImages={Array.from(selectedImages)}
							showFavoritesOnly={showFavoritesOnly}
							onDownloadSelected={handleDownloadSelected}
							onToggleFavorites={handleToggleFavorites}
							onClearSelection={handleClearSelection}
						/>
					</div>

					{/* Search and Filter Bar */}
					<div className="animate-fade-in-up mb-8">
						<SearchFilterBar
							onSearch={(query) => setSearchQuery(query)}
							onFilterDay={(day) => setSelectedDay(day)}
							onSortChange={handleSortChange}
							searchQuery={searchQuery}
							onSearchChange={handleSearchChange}
							showFavoritesOnly={showFavoritesOnly}
							onToggleFavorites={handleToggleFavorites}
							selectedDay={selectedDay}
							availableDays={availableDays}
							onDaySelect={handleDaySelect}
							imageCountsByDay={imageCountsByDay}
							isLoggedIn={isLoggedIn}
							onBatchModeToggle={setBatchMode}
							batchMode={batchMode}
							onSlideshowModeToggle={setSlideshowMode}
							slideshowMode={slideshowMode}
							slideshowInterval={slideshowInterval}
							onSlideshowIntervalChange={setSlideshowInterval}
							totalImages={totalImages}
							filteredCount={filteredImages.length}
							sortOrder={sortOrder}
						/>
					</div>

					{/* Virtualized Gallery Grid */}
					<VirtualizedGrid
						items={filteredImages}
						totalItems={totalImages}
						renderItem={(image) =>
							isLoggedIn ? (
								<AdminGalleryCard
									id={image.id}
									thumbnailUrl={image.thumbnailUrl}
									fullUrl={image.fullUrl}
									title={image.title}
									day={image.day}
									isFavorite={favorites.has(image.id)}
									isSelected={selectedImages.has(image.id)}
									isAdmin={isLoggedIn}
									isHighlight={image.isHighlight}
									onFavoriteToggle={handleFavoriteToggle}
									onSelect={handleImageSelect}
									onImageClick={handleImageClick}
									onDownload={handleDownload}
									onUpdateImage={handleUpdateImage}
									onDeleteImage={handleDeleteImage}
								/>
							) : (
								<GalleryCard
									id={image.id}
									thumbnailUrl={image.thumbnailUrl}
									fullUrl={image.fullUrl}
									day={image.day}
									isFavorite={favorites.has(image.id)}
									isSelected={selectedImages.has(image.id)}
									isHighlight={image.isHighlight}
									onFavoriteToggle={handleFavoriteToggle}
									onSelect={handleImageSelect}
									onImageClick={handleImageClick}
									onDownload={handleDownload}
								/>
							)
						}
						itemKey={(image) => image.id}
						onLoadMore={loadMoreImages}
						hasMore={hasMore}
						loading={loadingRef.current}
						className="mb-8"
						columnClassName="gap-3 sm:gap-4 lg:gap-6"
						columns={{ xs: 2, sm: 3, md: 4, lg: 4, xl: 5, xxl: 6 }}
						// Enhanced image viewer integration
						enableImageViewer={true}
						onImageClick={(image) => {
							// Track image usage for memory management
							trackImageUsage(image.thumbnailUrl, 3);
							trackImageUsage(image.fullUrl, 3);

							// Trigger memory cleanup if we have too many images
							if (filteredImages.length > 1000) {
								setTimeout(() => unloadUnusedImages(), 500);
							}

							// Open lightbox
							setLightboxImageId(image.id);
						}}
						imageViewerKeyExtractor={{
							id: (image) => image.id,
							thumbnailUrl: (image) => image.thumbnailUrl,
							fullUrl: (image) => image.fullUrl,
							title: (image) => image.title,
						}}
						loadingIndicator={
							<div className="inline-flex items-center px-4 py-2 mt-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 shadow-sm">
								<span className="w-4 h-4 mr-2 rounded-full border-2 border-plum-purple/20 border-t-plum-purple animate-spin"></span>
								Loading more images...
							</div>
						}
						emptyIndicator={
							images.length > 0 ? (
								<div className="text-center mt-16">
									<div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
										<h3 className="text-xl font-semibold text-gray-800 mb-2">
											No images found
										</h3>
										<p className="text-gray-600 mb-4">
											Try adjusting your search terms or filters.
										</p>
										<button
											onClick={() => {
												setSelectedDay(null);
												if (showFavoritesOnly) setShowFavoritesOnly(false);
											}}
											className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium">
											Clear All Filters
										</button>
									</div>
								</div>
							) : loadingError ? (
								<div className="text-center mt-16">
									<div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
										<h3 className="text-xl font-semibold text-red-600 mb-2">
											Error Loading Images
										</h3>
										<p className="text-gray-600 mb-4">{loadingError}</p>
										<button
											onClick={() => window.location.reload()}
											className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium">
											Refresh Page
										</button>
									</div>
								</div>
							) : null
						}
					/>

					{/* Lightbox */}
					<Lightbox
						isOpen={lightboxImageId !== null}
						imageId={lightboxImageId}
						images={filteredImages}
						onClose={() => setLightboxImageId(null)}
						onNavigate={(newImageId) => setLightboxImageId(newImageId)}
						onDownload={handleDownload}
					/>

					{/* Loading Popup */}
					<LoadingPopup
						isVisible={isDownloading}
						message="Downloading Images"
						progress={downloadProgress}
					/>
				</div>
			</div>
		</div>
	);
}
