"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import {
	X,
	ChevronLeft,
	ChevronRight,
	Download,
	ZoomIn,
	ZoomOut,
	Maximize2,
	Minimize2,
	Play,
	Pause,
	RotateCw,
	Info,
} from "lucide-react";

interface LightboxProps {
	isOpen: boolean;
	imageId: number | null;
	images: Array<{
		id: number;
		fullUrl: string;
		title: string;
		category?: string;
		tags?: string[];
		day?: number;
		uploadDate?: string;
	}>;
	onClose: () => void;
	onNavigate?: (newImageId: number) => void;
	onDownload: (fullUrl: string, title: string) => void;
}

const OptimizedLightbox: React.FC<LightboxProps> = ({
	isOpen,
	imageId,
	images,
	onClose,
	onNavigate,
	onDownload,
}) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const slideShowTimerRef = useRef<NodeJS.Timeout | null>(null);

	// State
	const [zoomLevel, setZoomLevel] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [showThumbnails, setShowThumbnails] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [touchStart, setTouchStart] = useState<{
		x: number;
		y: number;
		distance?: number;
	} | null>(null);
	const [touchEnd, setTouchEnd] = useState<{
		x: number;
		y: number;
		distance?: number;
	} | null>(null);

	// Computed values
	const currentIndex = images.findIndex((img) => img.id === imageId);
	const currentImage = currentIndex >= 0 ? images[currentIndex] : null;

	// Navigation helper
	const navigateImage = useCallback(
		(direction: "prev" | "next") => {
			if (currentIndex === -1 || !onNavigate) return;

			let newIndex;
			if (direction === "prev") {
				newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
			} else {
				newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
			}

			// Reset zoom and position when navigating
			setZoomLevel(1);
			setRotation(0);
			setPosition({ x: 0, y: 0 });

			const newImage = images[newIndex];
			if (newImage) {
				onNavigate(newImage.id);
			}
		},
		[currentIndex, images, onNavigate]
	);

	// Zoom controls with mouse position awareness
	const handleZoomIn = useCallback(() => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3));
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoomLevel((prev) => {
			const newZoom = Math.max(prev - 0.25, 0.5);
			// Reset position if zooming out to 1x or below
			if (newZoom <= 1) {
				setPosition({ x: 0, y: 0 });
			}
			return newZoom;
		});
	}, []);

	const handleZoomReset = useCallback(() => {
		setZoomLevel(1);
		setPosition({ x: 0, y: 0 });
		setRotation(0);
	}, []);

	// Rotation control
	const handleRotate = useCallback(() => {
		setRotation((prev) => (prev + 90) % 360);
	}, []);

	// Fullscreen toggle
	const toggleFullscreen = useCallback(() => {
		if (!document.fullscreenElement) {
			if (modalRef.current?.requestFullscreen) {
				modalRef.current
					.requestFullscreen()
					.then(() => setIsFullscreen(true))
					.catch((err) => console.error("Fullscreen error:", err.message));
			}
		} else {
			if (document.exitFullscreen) {
				document
					.exitFullscreen()
					.then(() => setIsFullscreen(false))
					.catch((err) => console.error("Exit fullscreen error:", err.message));
			}
		}
	}, []);

	// Slideshow controls
	const toggleSlideshow = useCallback(() => {
		if (isPlaying) {
			if (slideShowTimerRef.current) {
				clearInterval(slideShowTimerRef.current);
				slideShowTimerRef.current = null;
			}
		} else {
			slideShowTimerRef.current = setInterval(() => {
				navigateImage("next");
			}, 3000);
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying, navigateImage]);

	// Mouse handlers with improved dragging
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (zoomLevel > 1) {
				e.preventDefault();
				setIsDragging(true);
				setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
				// Change cursor immediately
				document.body.style.cursor = "grabbing";
			}
		},
		[zoomLevel, position]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging && zoomLevel > 1) {
				e.preventDefault();
				setPosition({
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				});
			}
		},
		[isDragging, zoomLevel, dragStart]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		document.body.style.cursor = "default";
	}, []);

	// Global mouse move and up handlers for better dragging experience
	useEffect(() => {
		const handleGlobalMouseMove = (e: MouseEvent) => {
			if (isDragging && zoomLevel > 1) {
				e.preventDefault();
				e.stopPropagation();
				setPosition({
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				});
			}
		};

		const handleGlobalMouseUp = (e: MouseEvent) => {
			if (isDragging) {
				e.preventDefault();
				e.stopPropagation();
				setIsDragging(false);
				// Reset cursor on the container if it's zoomed
				if (zoomLevel > 1) {
					const container = document.querySelector(
						".lightbox-image-container"
					) as HTMLElement;
					if (container) {
						container.style.cursor = "grab";
					}
				}
			}
		};

		if (isDragging) {
			document.addEventListener("mousemove", handleGlobalMouseMove, {
				passive: false,
			});
			document.addEventListener("mouseup", handleGlobalMouseUp, {
				passive: false,
			});
			document.addEventListener("mouseleave", handleGlobalMouseUp, {
				passive: false,
			});
		}

		return () => {
			document.removeEventListener("mousemove", handleGlobalMouseMove);
			document.removeEventListener("mouseup", handleGlobalMouseUp);
			document.removeEventListener("mouseleave", handleGlobalMouseUp);
		};
	}, [isDragging, zoomLevel, dragStart]);

	// Reset cursor when component unmounts or closes
	useEffect(() => {
		return () => {
			// Clean up any dragging state
			setIsDragging(false);
			const container = document.querySelector(
				".lightbox-image-container"
			) as HTMLElement;
			if (container) {
				container.style.cursor = "default";
			}
		};
	}, []);

	// Wheel zoom
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			if (!isOpen) return;
			e.preventDefault();

			if (e.deltaY < 0) {
				handleZoomIn();
			} else {
				handleZoomOut();
			}
		},
		[isOpen, handleZoomIn, handleZoomOut]
	);

	// Touch helpers
	const getTouchDistance = useCallback((touches: React.TouchList) => {
		if (touches.length < 2) return 0;
		const touch1 = touches[0];
		const touch2 = touches[1];
		return Math.sqrt(
			Math.pow(touch2.clientX - touch1.clientX, 2) +
				Math.pow(touch2.clientY - touch1.clientY, 2)
		);
	}, []);

	// Touch handlers
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 1) {
				setTouchStart({
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				});
			} else if (e.touches.length === 2) {
				const distance = getTouchDistance(e.touches);
				setTouchStart({
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
					distance,
				});
			}
		},
		[getTouchDistance]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStart) return;

			if (e.touches.length === 1) {
				setTouchEnd({
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				});
			} else if (e.touches.length === 2 && touchStart.distance) {
				e.preventDefault();
				const currentDistance = getTouchDistance(e.touches);
				const scaleChange = currentDistance / touchStart.distance;

				if (scaleChange > 1.1) {
					handleZoomIn();
					setTouchStart({ ...touchStart, distance: currentDistance });
				} else if (scaleChange < 0.9) {
					handleZoomOut();
					setTouchStart({ ...touchStart, distance: currentDistance });
				}
			}
		},
		[touchStart, getTouchDistance, handleZoomIn, handleZoomOut]
	);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStart || !touchEnd || e.touches.length > 0) return;

			const deltaX = touchEnd.x - touchStart.x;
			const minSwipeDistance = 50;

			if (Math.abs(deltaX) > minSwipeDistance) {
				if (deltaX > 0) {
					navigateImage("prev");
				} else {
					navigateImage("next");
				}
			}

			setTouchStart(null);
			setTouchEnd(null);
		},
		[touchStart, touchEnd, navigateImage]
	);

	// Effects
	useEffect(() => {
		if (isOpen && closeButtonRef.current) {
			closeButtonRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			// Prevent body scrolling and ensure full coverage
			document.body.style.overflow = "hidden";
			document.body.style.position = "fixed";
			document.body.style.width = "100%";
			document.body.style.height = "100%";
			document.documentElement.style.overflow = "hidden";
		} else {
			// Restore body scrolling
			document.body.style.overflow = "unset";
			document.body.style.position = "unset";
			document.body.style.width = "unset";
			document.body.style.height = "unset";
			document.documentElement.style.overflow = "unset";
		}

		return () => {
			// Cleanup on unmount
			document.body.style.overflow = "unset";
			document.body.style.position = "unset";
			document.body.style.width = "unset";
			document.body.style.height = "unset";
			document.documentElement.style.overflow = "unset";
		};
	}, [isOpen]);

	// Cleanup slideshow timer
	useEffect(() => {
		return () => {
			if (slideShowTimerRef.current) {
				clearInterval(slideShowTimerRef.current);
			}
		};
	}, []);

	// Preload adjacent images
	useEffect(() => {
		if (!isOpen || currentIndex === -1) return;

		const preloadUrls = [];
		if (currentIndex > 0) {
			preloadUrls.push(images[currentIndex - 1].fullUrl);
		}
		if (currentIndex < images.length - 1) {
			preloadUrls.push(images[currentIndex + 1].fullUrl);
		}

		preloadUrls.forEach((url) => {
			const img = new window.Image();
			img.src = url;
		});
	}, [isOpen, currentIndex, images]);

	// Single consolidated keyboard handler
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
				case " ":
					e.preventDefault();
					toggleSlideshow();
					break;
				case "+":
				case "=":
					e.preventDefault();
					handleZoomIn();
					break;
				case "-":
					e.preventDefault();
					handleZoomOut();
					break;
				case "0":
					e.preventDefault();
					handleZoomReset();
					break;
				case "r":
				case "R":
					e.preventDefault();
					handleRotate();
					break;
				case "f":
				case "F":
					e.preventDefault();
					toggleFullscreen();
					break;
				case "d":
				case "D":
					e.preventDefault();
					if (currentImage) {
						onDownload(currentImage.fullUrl, currentImage.title);
					}
					break;
				case "t":
				case "T":
					e.preventDefault();
					setShowThumbnails(!showThumbnails);
					break;
				case "?":
				case "h":
				case "H":
					e.preventDefault();
					setShowHelp(!showHelp);
					break;
				case "Home":
					e.preventDefault();
					if (images.length > 0 && onNavigate) {
						setZoomLevel(1);
						setRotation(0);
						setPosition({ x: 0, y: 0 });
						onNavigate(images[0].id);
					}
					break;
				case "End":
					e.preventDefault();
					if (images.length > 0 && onNavigate) {
						setZoomLevel(1);
						setRotation(0);
						setPosition({ x: 0, y: 0 });
						onNavigate(images[images.length - 1].id);
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		isOpen,
		onClose,
		navigateImage,
		toggleSlideshow,
		handleZoomIn,
		handleZoomOut,
		handleZoomReset,
		handleRotate,
		toggleFullscreen,
		currentImage,
		onDownload,
		showThumbnails,
		showHelp,
		images,
		onNavigate,
	]);

	if (!isOpen || !currentImage) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 bg-black w-screen h-screen z-50 animate-fade-in overflow-hidden"
			onClick={handleBackdropClick}
			onWheel={handleWheel}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			ref={modalRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="lightbox-title"
			style={{
				cursor: "default",
				userSelect: "none",
				WebkitUserSelect: "none",
				MozUserSelect: "none",
				msUserSelect: "none",
				WebkitTouchCallout: "none",
				WebkitTapHighlightColor: "transparent",
			}}>
			<div className="relative w-full h-full" style={{ cursor: "inherit" }}>
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

				{/* Navigation buttons */}
				{images.length > 1 && (
					<>
						<button
							onClick={() => navigateImage("prev")}
							className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 
                                     bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center 
                                     hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 
                                     transition-all duration-300 hover:scale-110 border border-white/20"
							aria-label="Previous image">
							<ChevronLeft size={28} strokeWidth={2} />
						</button>

						<button
							onClick={() => navigateImage("next")}
							className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 
                                     bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center 
                                     hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 
                                     transition-all duration-300 hover:scale-110 border border-white/20"
							aria-label="Next image">
							<ChevronRight size={28} strokeWidth={2} />
						</button>
					</>
				)}

				{/* Image container */}
				<div
					className="absolute inset-0 flex items-center justify-center overflow-hidden"
					style={{
						userSelect: "none",
						// Account for UI elements: top controls + bottom info panel
						padding: "80px 100px 160px 100px",
					}}>
					<div
						className="relative transition-transform duration-300 ease-out lightbox-image-container"
						data-zoom={zoomLevel}
						data-zoom-greater={zoomLevel > 1 ? "1" : "0"}
						data-dragging={isDragging ? "true" : "false"}
						style={{
							transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
							cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
							willChange: "transform",
						}}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseUp}
						onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
						draggable={false}>
						<Image
							src={currentImage.fullUrl}
							alt={currentImage.title}
							width={1200}
							height={800}
							className="max-w-full max-h-full object-contain shadow-2xl select-none"
							priority
							sizes="100vw"
							style={{
								pointerEvents: "none",
								userSelect: "none",
								WebkitUserSelect: "none",
								MozUserSelect: "none",
								msUserSelect: "none",
								WebkitTouchCallout: "none",
								WebkitTapHighlightColor: "transparent",
							}}
							draggable={false}
							onDragStart={(e) => e.preventDefault()}
						/>
					</div>
				</div>

				{/* Info panel */}
				<div className="absolute bottom-4 left-4 right-4 z-10 animate-slide-in-up">
					<div className="glass-card p-4 sm:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex-1 min-w-0">
								<h2
									id="lightbox-title"
									className="text-lg sm:text-xl font-bold text-white mb-2 truncate">
									{currentImage.title}
								</h2>
								<div className="flex flex-wrap items-center gap-3 text-sm">
									{currentImage.category && (
										<span
											className="bg-gradient-to-r from-honey-yellow/30 to-amber-400/30 text-amber-200 
                                                   px-3 py-1 rounded-full font-medium border border-honey-yellow/20">
											{currentImage.category}
										</span>
									)}
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
				{images.length > 1 && !showThumbnails && (
					<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
						<div className="flex items-center gap-2">
							{images.map((_, index) => (
								<div
									key={index}
									className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
										index === currentIndex
											? "bg-white scale-125"
											: "bg-white/40 hover:bg-white/60"
									}`}
									onClick={() => {
										if (onNavigate && images[index]) {
											setZoomLevel(1);
											setRotation(0);
											setPosition({ x: 0, y: 0 });
											onNavigate(images[index].id);
										}
									}}
								/>
							))}
						</div>
					</div>
				)}

				{/* Thumbnail strip */}
				{showThumbnails && images.length > 1 && (
					<div className="absolute bottom-4 left-4 right-4 z-10">
						<div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20">
							<div className="flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
								{images.map((image, index) => (
									<div
										key={image.id}
										className={`flex-shrink-0 relative cursor-pointer transition-all duration-300 ${
											index === currentIndex
												? "ring-2 ring-white scale-110"
												: "hover:scale-105 opacity-70 hover:opacity-100"
										}`}
										onClick={() => {
											if (onNavigate) {
												setZoomLevel(1);
												setRotation(0);
												setPosition({ x: 0, y: 0 });
												onNavigate(image.id);
											}
										}}>
										<div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
											<Image
												src={image.fullUrl}
												alt={image.title}
												width={64}
												height={64}
												className="w-full h-full object-cover"
												sizes="64px"
											/>
										</div>
										{index === currentIndex && (
											<div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black/50"></div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Controls panel */}
				<div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
					{/* Zoom and rotation controls */}
					<div className="flex items-center gap-2">
						<button
							onClick={handleZoomOut}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label="Zoom out">
							<ZoomOut size={20} />
						</button>
						<button
							onClick={handleZoomIn}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label="Zoom in">
							<ZoomIn size={20} />
						</button>
						<button
							onClick={handleRotate}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label="Rotate image">
							<RotateCw size={20} />
						</button>
						<button
							onClick={() => setShowHelp(!showHelp)}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label="Show keyboard shortcuts">
							<Info size={20} />
						</button>
					</div>

					{/* Fullscreen and slideshow controls */}
					<div className="flex items-center gap-2">
						<button
							onClick={toggleFullscreen}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label="Toggle fullscreen">
							{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
						</button>
						<button
							onClick={toggleSlideshow}
							className="w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20"
							aria-label={isPlaying ? "Stop slideshow" : "Start slideshow"}>
							{isPlaying ? <Pause size={20} /> : <Play size={20} />}
						</button>
						{images.length > 1 && (
							<button
								onClick={() => setShowThumbnails(!showThumbnails)}
								className={`w-10 h-10 backdrop-blur-sm text-white rounded-lg 
                                     flex items-center justify-center hover:bg-white/20 transition-all duration-200
                                     border border-white/20 ${
																																						showThumbnails
																																							? "bg-white/20"
																																							: "bg-white/10"
																																					}`}
								aria-label="Toggle thumbnails">
								<div className="grid grid-cols-2 gap-0.5 w-4 h-4">
									<div className="bg-white rounded-sm w-1.5 h-1.5"></div>
									<div className="bg-white rounded-sm w-1.5 h-1.5"></div>
									<div className="bg-white rounded-sm w-1.5 h-1.5"></div>
									<div className="bg-white rounded-sm w-1.5 h-1.5"></div>
								</div>
							</button>
						)}
					</div>
				</div>

				{/* Help overlay */}
				{showHelp && (
					<div
						className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 
					               bg-black/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
							<button
								onClick={() => setShowHelp(false)}
								className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors">
								<X size={16} />
							</button>
						</div>
						<div className="grid grid-cols-1 gap-3 text-sm">
							<div className="flex justify-between text-white/90">
								<span>Navigate:</span>
								<span className="font-mono">← → Arrow Keys</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Zoom In/Out:</span>
								<span className="font-mono">+ / -</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Reset Zoom:</span>
								<span className="font-mono">0</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Rotate:</span>
								<span className="font-mono">R</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Fullscreen:</span>
								<span className="font-mono">F</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Slideshow:</span>
								<span className="font-mono">Space</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Download:</span>
								<span className="font-mono">D</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Thumbnails:</span>
								<span className="font-mono">T</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>First/Last:</span>
								<span className="font-mono">Home / End</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Close:</span>
								<span className="font-mono">Esc</span>
							</div>
							<div className="flex justify-between text-white/90">
								<span>Help:</span>
								<span className="font-mono">H or ?</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default OptimizedLightbox;
