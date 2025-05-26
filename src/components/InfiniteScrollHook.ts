import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions {
	threshold?: number;
	debounceTime?: number;
	disabled?: boolean;
}

/**
 * A custom hook for implementing infinite scroll with performance optimizations
 * @param callback Function to call when scrolling threshold is reached
 * @param hasMore Boolean indicating if there's more content to load
 * @param options Configuration options
 */
export function useInfiniteScroll(
	callback: () => void,
	hasMore: boolean,
	options: UseInfiniteScrollOptions = {}
) {
	const { threshold = 1500, debounceTime = 200, disabled = false } = options;

	const [isFetching, setIsFetching] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const callbackRef = useRef(callback);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isDisabledRef = useRef(disabled);

	// Update the callback ref when the callback changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Update the disabled ref when disabled changes
	useEffect(() => {
		isDisabledRef.current = disabled;
	}, [disabled]);

	// Debounced scroll handler
	const handleIntersection = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			const entry = entries[0];

			if (
				entry.isIntersecting &&
				hasMore &&
				!isFetching &&
				!isDisabledRef.current
			) {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				setIsFetching(true);

				timeoutRef.current = setTimeout(() => {
					callbackRef.current();
					// Let the callback finish before allowing fetching again
					setTimeout(() => setIsFetching(false), 100);
				}, debounceTime);
			}
		},
		[hasMore, isFetching, debounceTime]
	);

	// Setup the IntersectionObserver
	useEffect(() => {
		// Clean up any existing observer
		if (observerRef.current) {
			observerRef.current.disconnect();
		}

		// Create a new observer if we have a sentinel element
		if (sentinelRef.current) {
			const options = {
				rootMargin: `0px 0px ${threshold}px 0px`,
				threshold: 0,
			};

			observerRef.current = new IntersectionObserver(handleIntersection, options);
			observerRef.current.observe(sentinelRef.current);
		}

		// Cleanup function
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [handleIntersection, threshold]);

	// Reset fetching state when hasMore changes
	useEffect(() => {
		if (!hasMore && isFetching) {
			setIsFetching(false);
		}
	}, [hasMore, isFetching]);

	// Return the sentinel ref to be attached to a div at the end of your content
	return {
		sentinelRef,
		isFetching,
	};
}
