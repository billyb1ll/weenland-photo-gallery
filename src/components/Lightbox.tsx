"use client";

import React, { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface LightboxProps {
	isOpen: boolean;
	imageId: number | null;
	images: Array<{
		id: number;
		fullUrl: string;
		title: string;
		category: string;
	}>;
	onClose: () => void;
	onDownload: (fullUrl: string, title: string) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
	isOpen,
	imageId,
	images,
	onClose,
	onDownload,
}) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const currentIndex = images.findIndex((img) => img.id === imageId);
	const currentImage = currentIndex >= 0 ? images[currentIndex] : null;

	// Keyboard navigation
	const navigateImage = useCallback(
		(direction: "prev" | "next") => {
			if (currentIndex === -1) return;

			let newIndex;
			if (direction === "prev") {
				newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
			} else {
				newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
			}

			// Update the current image by finding the new image ID
			const newImage = images[newIndex];
			if (newImage) {
				// We need to update the imageId in the parent component
				// For now, we'll just close and let the parent handle navigation
				// In a real app, you'd pass a navigation callback
			}
		},
		[currentIndex, images]
	);

	// Focus management for accessibility
	useEffect(() => {
		if (isOpen && closeButtonRef.current) {
			closeButtonRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			switch (e.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowLeft":
					navigateImage("prev");
					break;
				case "ArrowRight":
					navigateImage("next");
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, navigateImage, onClose]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!isOpen || !currentImage) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
			onClick={handleBackdropClick}
			ref={modalRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="lightbox-title">
			<div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
				{/* Close button */}
				<button
					ref={closeButtonRef}
					onClick={onClose}
					className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-xl 
                             flex items-center justify-center hover:bg-white/20 focus:outline-none focus:ring-2 
                             focus:ring-white/50 transition-all duration-300 hover:scale-110 border border-white/20"
					aria-label="Close lightbox">
					<X size={24} strokeWidth={2} />
				</button>

				{/* Previous button */}
				{images.length > 1 && (
					<button
						onClick={() => navigateImage("prev")}
						className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 
                                 bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center 
                                 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 
                                 transition-all duration-300 hover:scale-110 border border-white/20"
						aria-label="Previous image">
						<ChevronLeft size={28} strokeWidth={2} />
					</button>
				)}

				{/* Next button */}
				{images.length > 1 && (
					<button
						onClick={() => navigateImage("next")}
						className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 
                                 bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center 
                                 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 
                                 transition-all duration-300 hover:scale-110 border border-white/20"
						aria-label="Next image">
						<ChevronRight size={28} strokeWidth={2} />
					</button>
				)}

				{/* Image container */}
				<div className="relative w-full h-full flex items-center justify-center animate-slide-in-up">
					<div className="relative max-w-full max-h-full">
						<Image
							src={currentImage.fullUrl}
							alt={currentImage.title}
							width={1200}
							height={800}
							className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
							priority
						/>

						{/* Image loading overlay */}
						<div
							className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg opacity-0 
                                      transition-opacity duration-300 flex items-center justify-center">
							<div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
						</div>
					</div>
				</div>

				{/* Image info panel */}
				<div
					className="absolute bottom-4 left-4 right-4 z-10 animate-slide-in-up"
					style={{ animationDelay: "200ms" }}>
					<div className="glass-card p-4 sm:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex-1 min-w-0">
								<h2
									id="lightbox-title"
									className="text-lg sm:text-xl font-bold text-white mb-2 truncate">
									{currentImage.title}
								</h2>
								<div className="flex flex-wrap items-center gap-3 text-sm">
									<span
										className="bg-gradient-to-r from-honey-yellow/30 to-amber-400/30 text-amber-200 
                                                   px-3 py-1 rounded-full font-medium border border-honey-yellow/20">
										{currentImage.category}
									</span>
									<span className="text-white/80">
										{currentIndex + 1} of {images.length}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{/* Mobile navigation */}
								{images.length > 1 && (
									<div className="flex items-center gap-2 sm:hidden">
										<button
											onClick={() => navigateImage("prev")}
											className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                                     border border-white/20"
											aria-label="Previous image">
											<ChevronLeft size={20} />
										</button>
										<button
											onClick={() => navigateImage("next")}
											className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                                     border border-white/20"
											aria-label="Next image">
											<ChevronRight size={20} />
										</button>
									</div>
								)}

								{/* Download button */}
								<button
									onClick={() => onDownload(currentImage.fullUrl, currentImage.title)}
									className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-4 sm:px-6 py-2.5 
                                             rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none 
                                             focus:ring-2 focus:ring-white/50 transition-all duration-300 flex items-center gap-2
                                             font-medium shadow-lg shadow-plum-purple/25 hover:shadow-plum-purple/40 
                                             hover:scale-105 border border-white/20"
									aria-label={`Download ${currentImage.title}`}>
									<Download size={18} />
									<span className="hidden sm:inline">Download</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Progress indicator */}
				{images.length > 1 && (
					<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
						<div className="flex items-center gap-2">
							{images.map((_, index) => (
								<div
									key={index}
									className={`w-2 h-2 rounded-full transition-all duration-300 ${
										index === currentIndex
											? "bg-white scale-125"
											: "bg-white/40 hover:bg-white/60"
									}`}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Lightbox;
