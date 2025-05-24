"use client";

import React, { useState, useEffect } from "react";
import GalleryCard from "@/components/GalleryCard";
import Lightbox from "@/components/Lightbox";
import DayNavigationWithFeatures from "@/components/DayNavigationWithFeatures";
import ModernAdminNavBar from "../components/ModernAdminNavBar";
import LoadingPopup from "@/components/LoadingPopup";
import imagesData from "@/data/images.json";

interface ImageData {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	category: string;
	tags: string[];
	day?: number; // Add day property
	uploadDate?: string;
}

export default function Home() {
	const [images, setImages] = useState<ImageData[]>([]);
	const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
	const [favorites, setFavorites] = useState<Set<number>>(new Set());
	const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [lightboxImageId, setLightboxImageId] = useState<number | null>(null);
	const [displayedImages, setDisplayedImages] = useState<ImageData[]>([]);
	const [itemsToShow, setItemsToShow] = useState(20);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState<number | undefined>(
		undefined
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

	// Initialize images with day assignments
	useEffect(() => {
		const imagesWithDays = (imagesData as ImageData[]).map((img, index) => ({
			...img,
			day: Math.floor(index / 8) + 1, // Group every 8 images into a day
			uploadDate: new Date(
				Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
			).toISOString(),
		}));
		setImages(imagesWithDays);
	}, []);

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

		setFilteredImages(filtered);
	}, [images, selectedDay, showFavoritesOnly, favorites]);

	// Update displayed images for infinite scroll
	useEffect(() => {
		setDisplayedImages(filteredImages.slice(0, itemsToShow));
	}, [filteredImages, itemsToShow]);

	// Infinite scroll handler
	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + document.documentElement.scrollTop >=
				document.documentElement.offsetHeight - 1000
			) {
				setItemsToShow((prev) => Math.min(prev + 20, filteredImages.length));
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [filteredImages.length]);

	// Get available days from images
	const availableDays = Array.from(
		new Set(
			images
				.map((img) => img.day)
				.filter((day): day is number => day !== undefined)
		)
	).sort((a, b) => a - b);
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

	const handleImageClick = (id: number) => {
		setLightboxImageId(id);
	};

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

	// Handle day navigation
	const handleDaySelect = (day: number | null) => {
		setSelectedDay(day);
	};

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

	const handleImageUpload = (file: File, day: number) => {
		// Placeholder for Google Cloud Storage upload
		console.log("Upload requested:", file.name, "for day:", day);
		// TODO: Implement actual upload to Google Cloud Storage
	};

	return (
		<div className="min-h-screen bg-white relative">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-plum-purple/5 to-honey-yellow/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-honey-yellow/8 to-plum-purple/5 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-plum-purple/3 to-honey-yellow/5 rounded-full blur-3xl"></div>
			</div>

			{/* Admin Navigation Bar */}
			<ModernAdminNavBar
				isLoggedIn={isLoggedIn}
				onLogin={handleAdminLogin}
				onLogout={handleAdminLogout}
				onImageUpload={handleImageUpload}
			/>

			<div className={`relative z-10 ${isLoggedIn ? "pt-0" : ""}`}>
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
					{/* Header */}
					<header className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight">
							<span className="bg-gradient-to-r from-plum-purple via-purple-600 to-honey-yellow bg-clip-text text-transparent">
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

					{/* Gallery Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
						{displayedImages.map((image, index) => (
							<div
								key={image.id}
								className="animate-fade-in-up"
								style={{ animationDelay: `${index * 50}ms` }}>
								<GalleryCard
									id={image.id}
									thumbnailUrl={image.thumbnailUrl}
									fullUrl={image.fullUrl}
									day={image.day}
									isFavorite={favorites.has(image.id)}
									isSelected={selectedImages.has(image.id)}
									onFavoriteToggle={handleFavoriteToggle}
									onSelect={handleImageSelect}
									onImageClick={handleImageClick}
									onDownload={handleDownload}
								/>
							</div>
						))}
					</div>

					{/* Load More Indicator */}
					{filteredImages.length > displayedImages.length && (
						<div className="text-center mt-8">
							<div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 shadow-sm">
								Loading more images... ({displayedImages.length} of{" "}
								{filteredImages.length})
							</div>
						</div>
					)}

					{/* No Results */}
					{filteredImages.length === 0 && images.length > 0 && (
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
					)}

					{/* Lightbox */}
					<Lightbox
						isOpen={lightboxImageId !== null}
						imageId={lightboxImageId}
						images={filteredImages}
						onClose={() => setLightboxImageId(null)}
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
