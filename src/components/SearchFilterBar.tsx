"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Calendar, X, ChevronDown } from "lucide-react";

interface SearchFilterBarProps {
	onSearch: (query: string) => void;
	onFilterDay: (day: number | null) => void;
	onSortChange: (
		sort: "date-newest" | "date-oldest" | "name-asc" | "name-desc"
	) => void;
	totalImages: number;
	filteredCount: number;
	searchQuery: string;
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	showFavoritesOnly: boolean;
	onToggleFavorites: () => void;
	selectedDay: number | null;
	availableDays: number[];
	onDaySelect: (day: number | null) => void;
	imageCountsByDay: Record<number, number>;
	isLoggedIn: boolean;
	onBatchModeToggle: (enabled: boolean) => void;
	batchMode: boolean;
	onSlideshowModeToggle: (enabled: boolean) => void;
	slideshowMode: boolean;
	slideshowInterval: number;
	onSlideshowIntervalChange: (interval: number) => void;
	sortOrder: "date-newest" | "date-oldest" | "name-asc" | "name-desc";
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
	onSearch,
	onFilterDay,
	onSortChange,
	totalImages,
	filteredCount,
	searchQuery,
	onSearchChange,
	showFavoritesOnly,
	onToggleFavorites,
	selectedDay,
	availableDays,
	onDaySelect,
	imageCountsByDay,
	isLoggedIn,
	onBatchModeToggle,
	batchMode,
	onSlideshowModeToggle,
	slideshowMode,
	slideshowInterval,
	onSlideshowIntervalChange,
	sortOrder,
}) => {
	const [showFilters, setShowFilters] = useState(false);
	const [isSticky, setIsSticky] = useState(false);

	// Days for the dropdown (1-9)
	const days = Array.from({ length: 9 }, (_, i) => i + 1);

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSearchChange(e);
		onSearch(e.target.value);
	};

	// Clear search
	const clearSearch = () => {
		const emptyEvent = {
			target: { value: "" },
		} as React.ChangeEvent<HTMLInputElement>;
		onSearchChange(emptyEvent);
		onSearch("");
	};

	// Handle day filter change
	const handleDayChange = (day: number | null) => {
		onFilterDay(day);
		onDaySelect(day);
	};

	// Handle sort change
	const handleSortChange = (
		sort: "date-newest" | "date-oldest" | "name-asc" | "name-desc"
	) => {
		onSortChange(sort);
	};

	// Make the search bar sticky on scroll
	useEffect(() => {
		const handleScroll = () => {
			const offset = window.scrollY;
			setIsSticky(offset > 100);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<div
			className={`w-full transition-all duration-300 ${
				isSticky
					? "sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-md py-3"
					: "py-4"
			}`}>
			<div className="container mx-auto px-4">
				{/* Search and filter top bar */}
				<div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
					{/* Search input */}
					<div className="relative flex-grow">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={handleSearchChange}
								placeholder="Search images by name or date..."
								className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							/>
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={18}
							/>
							{searchQuery && (
								<button
									onClick={clearSearch}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700">
									<X size={18} />
								</button>
							)}
						</div>
					</div>

					{/* Filter toggle button */}
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-gray-700 transition-colors whitespace-nowrap">
						<Filter size={16} />
						{showFilters ? "Hide Filters" : "Show Filters"}
						<ChevronDown
							size={16}
							className={`transform transition-transform ${
								showFilters ? "rotate-180" : ""
							}`}
						/>
					</button>

					{/* Sort dropdown */}
					<div className="relative">
						<select
							value={sortOrder}
							onChange={(e) =>
								handleSortChange(
									e.target.value as
										| "date-newest"
										| "date-oldest"
										| "name-asc"
										| "name-desc"
								)
							}
							className="appearance-none px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 pr-10 transition-colors cursor-pointer">
							<option value="date-newest">Newest First</option>
							<option value="date-oldest">Oldest First</option>
							<option value="name-asc">Name (A-Z)</option>
							<option value="name-desc">Name (Z-A)</option>
						</select>
						<ChevronDown
							size={16}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
						/>
					</div>
				</div>

				{/* Filter options */}
				{showFilters && (
					<div className="mt-4 p-4 bg-gray-50 rounded-lg">
						{/* Day filter */}
						<div>
							<div className="font-medium mb-2 flex items-center gap-2">
								<Calendar size={16} />
								Filter by Day
							</div>
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => handleDayChange(null)}
									className={`px-3 py-1 rounded-full text-sm ${
										selectedDay === null
											? "bg-blue-500 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}>
									All Days
								</button>
								{days.map((day) => (
									<button
										key={day}
										onClick={() => handleDayChange(day)}
										className={`px-3 py-1 rounded-full text-sm ${
											selectedDay === day
												? "bg-blue-500 text-white"
												: "bg-gray-200 text-gray-700 hover:bg-gray-300"
										}`}>
										Day {day}
									</button>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Results counter */}
				<div className="mt-2 text-sm text-gray-500">
					Showing {filteredCount} of {totalImages} images
					{(searchQuery || selectedDay) && (
						<button
							onClick={() => {
								clearSearch();
								handleDayChange(null);
							}}
							className="ml-2 text-blue-500 hover:underline">
							Clear all filters
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchFilterBar;
