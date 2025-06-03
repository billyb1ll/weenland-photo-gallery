"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface VirtualizedGridProps<T> {
	items: T[];
	totalItems: number;
	renderItem: (item: T, index: number) => React.ReactNode;
	itemKey: (item: T) => string | number;
	onLoadMore: () => void;
	hasMore: boolean;
	loading?: boolean;
	loadingIndicator?: React.ReactNode;
	emptyIndicator?: React.ReactNode;
	className?: string;
	columnClassName?: string;
	columns?:
		| number
		| { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
	// Enhanced features
	zoomOnHover?: boolean;
	animationVariant?: "fade" | "scale" | "slide" | "none";
	gridGap?: "none" | "small" | "medium" | "large";
	// Image viewer integration
	enableImageViewer?: boolean;
	onImageClick?: (item: T, index: number) => void;
	imageViewerKeyExtractor?: {
		id: (item: T) => string | number;
		thumbnailUrl: (item: T) => string;
		fullUrl: (item: T) => string;
		title: (item: T) => string;
	};
}

/**
 * A component that virtualizes a grid of items for better performance with large collections
 */
export default function VirtualizedGrid<T>({
	items,
	totalItems,
	renderItem,
	itemKey,
	onLoadMore,
	hasMore,
	loading = false,
	loadingIndicator,
	emptyIndicator,
	className = "",
	columnClassName = "",
	columns = { xs: 2, sm: 3, md: 4, lg: 4, xl: 5, xxl: 6 },
	// Enhanced feature defaults
	zoomOnHover = false,
	animationVariant = "fade",
	gridGap = "medium",
	// Image viewer integration defaults
	enableImageViewer = false,
	onImageClick,
	imageViewerKeyExtractor, // eslint-disable-line @typescript-eslint/no-unused-vars
}: VirtualizedGridProps<T>) {
	// Track client-side hydration to prevent SSR mismatches
	const [isClient, setIsClient] = useState(false);

	// Track if we're actively loading more items
	const [isActivelyLoading, setIsActivelyLoading] = useState(loading);
	const loadingRef = useRef(loading);

	// Set client-side flag after hydration
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Update loading ref when loading prop changes
	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	// Wrapper for onLoadMore to track loading state
	const handleLoadMore = useCallback(() => {
		if (loadingRef.current) return;

		setIsActivelyLoading(true);
		onLoadMore();

		// Reset loading state after a timeout if it wasn't reset by the parent
		const timeout = setTimeout(() => {
			setIsActivelyLoading(false);
		}, 5000); // 5 second safety timeout

		return () => clearTimeout(timeout);
	}, [onLoadMore]);

	// Reset active loading when loading prop changes to false
	useEffect(() => {
		if (!loading && isActivelyLoading) {
			setIsActivelyLoading(false);
		}
	}, [loading, isActivelyLoading]);

	// Use our infinite scroll hook
	const { sentinelRef, isFetching } = useInfiniteScroll(
		handleLoadMore,
		hasMore,
		{
			threshold: 1500,
			disabled: loading || isActivelyLoading,
		}
	);

	// We use isFetching directly from the hook

	// Get responsive column configuration
	const getColumnClass = () => {
		if (typeof columns === "number") {
			return `grid-cols-${columns}`;
		}

		return `grid-cols-${columns.xs} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl} 2xl:grid-cols-${columns.xxl}`;
	};

	// Get grid gap based on selected option
	const getGapClass = () => {
		switch (gridGap) {
			case "none":
				return "gap-0";
			case "small":
				return "gap-1";
			case "large":
				return "gap-4";
			case "medium":
			default:
				return "gap-2";
		}
	};

	// Get animation class based on variant
	const getAnimationClass = () => {
		// Only apply animations after client-side hydration to prevent SSR mismatches
		if (!isClient) {
			return "opacity-100"; // Show items immediately on server-side
		}

		switch (animationVariant) {
			case "fade":
				return `animate-fade-in opacity-0`;
			case "scale":
				return `animate-scale-in origin-center scale-95 opacity-0`;
			case "slide":
				return `animate-slide-up translate-y-4 opacity-0`;
			case "none":
				return "";
			default:
				// Fallback with basic opacity transition if custom animations fail
				return "opacity-100 transition-opacity duration-500";
		}
	};

	// Get zoom class if enabled
	const getZoomClass = () => {
		const baseClass = zoomOnHover
			? "transition-transform duration-300 hover:scale-105 hover:z-10"
			: "";
		const cursorClass = enableImageViewer ? "cursor-pointer" : "";
		return `${baseClass} ${cursorClass}`.trim();
	};

	// Calculate if we should show loading indicator
	const showLoading = loading || isActivelyLoading || isFetching;

	return (
		<div className={`relative ${className}`} suppressHydrationWarning>
			<div
				className={`grid ${getColumnClass()} ${getGapClass()} ${columnClassName}`}>
				{items.map((item, index) => (
					<div
						key={itemKey(item)}
						className={`${getAnimationClass()} ${getZoomClass()}`}
						style={
							isClient ? { animationDelay: `${(index % 10) * 50}ms` } : undefined
						}
						suppressHydrationWarning
						onClick={() => {
							if (enableImageViewer && onImageClick) {
								onImageClick(item, index);
							}
						}}>
						{renderItem(item, index)}
					</div>
				))}
			</div>

			{/* Loading indicator */}
			{showLoading && (
				<div className="text-center py-4">
					{loadingIndicator || (
						<div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 shadow-sm">
							{items.length === 0 ? (
								<>
									<span className="w-4 h-4 mr-2 rounded-full border-2 border-plum-purple/20 border-t-plum-purple animate-spin"></span>
									Loading images...
								</>
							) : (
								<>
									Loading more images... ({items.length} of {totalItems})
								</>
							)}
						</div>
					)}
				</div>
			)}

			{/* Empty state */}
			{items.length === 0 && !showLoading && (
				<div className="py-8">
					{emptyIndicator || (
						<div className="text-center text-gray-500">No items found</div>
					)}
				</div>
			)}

			{/* Sentinel element for infinite scrolling */}
			{hasMore && (
				<div ref={sentinelRef} className="sentinel-element h-10 w-full" />
			)}
		</div>
	);
}
