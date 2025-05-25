"use client";

import React from "react";
import { Search, Filter, Download, Heart } from "lucide-react";

interface FeatureBarProps {
	searchTerm: string;
	selectedCategory: string;
	selectedImages: number[];
	showFavoritesOnly: boolean;
	categories: string[];
	onSearchChange: (term: string) => void;
	onCategoryChange: (category: string) => void;
	onDownloadSelected: () => void;
	onToggleFavorites: () => void;
	onClearSelection: () => void;
}

const FeatureBar: React.FC<FeatureBarProps> = ({
	searchTerm,
	selectedCategory,
	selectedImages,
	showFavoritesOnly,
	categories,
	onSearchChange,
	onCategoryChange,
	onDownloadSelected,
	onToggleFavorites,
	onClearSelection,
}) => {
	return (
		<div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in-up shadow-sm">
			{/* Mobile-first layout */}
			<div className="space-y-4">
				{/* Top row: Search and Category */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					{/* Search Input */}
					<div className="relative flex-1">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search by title or tags..."
							value={searchTerm}
							onChange={(e) => onSearchChange(e.target.value)}
							className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-plum-purple/50 focus:border-plum-purple/50 
                       transition-all duration-300 hover:bg-gray-100 text-gray-700 placeholder-gray-500
                       shadow-sm hover:shadow-md"
							aria-label="Search images by title or tags"
						/>
					</div>

					{/* Category Filter */}
					<div className="relative sm:min-w-[180px]">
						<Filter
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
							size={18}
						/>
						<select
							value={selectedCategory}
							onChange={(e) => onCategoryChange(e.target.value)}
							className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-plum-purple/50 focus:border-plum-purple/50 
                       transition-all duration-300 hover:bg-gray-100 text-gray-700 cursor-pointer
                       shadow-sm hover:shadow-md"
							aria-label="Filter by category">
							<option value="">All Categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Second row: Actions and Controls */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
					{/* Left side: Favorites toggle */}
					<div className="flex items-center gap-3">
						<button
							onClick={onToggleFavorites}
							className={`modern-btn px-4 py-2.5 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 font-medium
                        ${
																									showFavoritesOnly
																										? "bg-gradient-to-r from-red-500 to-pink-500 border-red-400 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
																										: "bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
																								}`}
							aria-label={
								showFavoritesOnly ? "Show all images" : "Show favorites only"
							}>
							<Heart size={16} fill={showFavoritesOnly ? "currentColor" : "none"} />
							<span className="hidden sm:inline">
								{showFavoritesOnly ? "Show All" : "Favorites"}
							</span>
							<span className="sm:hidden">{showFavoritesOnly ? "All" : "♥"}</span>
						</button>

						{/* Selection info for mobile */}
						{selectedImages.length > 0 && (
							<div className="flex items-center gap-2 bg-plum-purple/10 px-3 py-2 rounded-lg">
								<span className="text-sm font-medium text-plum-purple">
									{selectedImages.length} selected
								</span>
								<button
									onClick={onClearSelection}
									className="text-xs text-plum-purple/70 hover:text-plum-purple underline"
									aria-label="Clear selection">
									Clear
								</button>
							</div>
						)}
					</div>

					{/* Right side: Download button */}
					<div className="flex items-center justify-end">
						<button
							onClick={onDownloadSelected}
							disabled={selectedImages.length === 0}
							className={`modern-btn px-4 sm:px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                        ${
																									selectedImages.length > 0
																										? "bg-gradient-to-r from-plum-purple to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-plum-purple/25 hover:shadow-plum-purple/40 transform hover:scale-105"
																										: "bg-gray-200 text-gray-400 cursor-not-allowed"
																								}`}
							aria-label={`Download ${selectedImages.length} selected images as ZIP`}>
							<Download size={16} />
							<span className="hidden sm:inline">Download Selected</span>
							<span className="sm:hidden">Download</span>
							{selectedImages.length > 0 && (
								<span className="bg-white/30 text-xs px-2 py-0.5 rounded-full font-semibold">
									{selectedImages.length}
								</span>
							)}
						</button>
					</div>
				</div>

				{/* Active Filters Display */}
				{(searchTerm || selectedCategory || showFavoritesOnly) && (
					<div className="pt-4 border-t border-gray-200">
						<div className="flex flex-wrap gap-2 items-center">
							<span className="text-sm text-gray-600 font-medium">
								Active filters:
							</span>

							{searchTerm && (
								<span className="bg-gradient-to-r from-plum-purple/20 to-purple-500/20 text-plum-purple px-3 py-1.5 rounded-full text-sm font-medium border border-plum-purple/20">
									Search: &ldquo;{searchTerm}&rdquo;
								</span>
							)}

							{selectedCategory && (
								<span className="bg-gradient-to-r from-honey-yellow/30 to-amber-400/30 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium border border-honey-yellow/30">
									Category: {selectedCategory}
								</span>
							)}

							{showFavoritesOnly && (
								<span className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium border border-red-200">
									♥ Favorites Only
								</span>
							)}

							<button
								onClick={() => {
									onSearchChange("");
									onCategoryChange("");
									if (showFavoritesOnly) onToggleFavorites();
								}}
								className="text-sm text-gray-500 hover:text-gray-700 underline ml-2 transition-colors duration-200">
								Clear all filters
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default FeatureBar;
