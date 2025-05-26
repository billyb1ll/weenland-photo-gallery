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
}: VirtualizedGridProps<T>) {
	// Track if we're actively loading more items
	const [isActivelyLoading, setIsActivelyLoading] = useState(loading);
	const loadingRef = useRef(loading);

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

	// Initialize isFetching state to avoid uninitialized variable error
	const [localIsFetching, setLocalIsFetching] = useState(false);

	// Sync local state with hook value when it changes
	useEffect(() => {
		if (isFetching !== undefined) {
			setLocalIsFetching(isFetching);
		}
	}, [isFetching]);

	// Get responsive column configuration
	const getColumnClass = () => {
		if (typeof columns === "number") {
			return `grid-cols-${columns}`;
		}

		return `grid-cols-${columns.xs} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl} 2xl:grid-cols-${columns.xxl}`;
	};

	// Calculate if we should show loading indicator
	const showLoading = loading || isActivelyLoading || isFetching;

	return (
		<div className={`relative ${className}`}>
			<div className={`grid ${getColumnClass()} ${columnClassName}`}>
				{items.map((item, index) => (
					<div
						key={itemKey(item)}
						className="animate-fade-in-up"
						style={{ animationDelay: `${(index % 10) * 50}ms` }}>
						{renderItem(item, index)}
					</div>
				))}
			</div>

			{/* Loading indicator */}
			{showLoading && items.length > 0 && (
				<div className="text-center py-4">
					{loadingIndicator || (
						<div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 shadow-sm">
							Loading more images... ({items.length} of {totalItems})
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
