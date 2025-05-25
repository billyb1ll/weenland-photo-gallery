"use client";

import React from "react";
import {
	Download,
	Heart,
	Calendar,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

interface DayNavigationWithFeaturesProps {
	// Day navigation props
	selectedDay: number | null;
	availableDays: number[];
	onDaySelect: (day: number | null) => void;
	imageCountsByDay: Record<number, number>;

	// Feature bar props
	selectedImages: number[];
	showFavoritesOnly: boolean;
	onDownloadSelected: () => void;
	onToggleFavorites: () => void;
	onClearSelection: () => void;
}

const DayNavigationWithFeatures: React.FC<DayNavigationWithFeaturesProps> = ({
	selectedDay,
	availableDays,
	onDaySelect,
	imageCountsByDay,
	selectedImages,
	showFavoritesOnly,
	onDownloadSelected,
	onToggleFavorites,
	onClearSelection,
}) => {
	const handlePrevDay = () => {
		if (selectedDay === null) return;
		const currentIndex = availableDays.indexOf(selectedDay);
		if (currentIndex > 0) {
			onDaySelect(availableDays[currentIndex - 1]);
		}
	};

	const handleNextDay = () => {
		if (selectedDay === null) return;
		const currentIndex = availableDays.indexOf(selectedDay);
		if (currentIndex < availableDays.length - 1) {
			onDaySelect(availableDays[currentIndex + 1]);
		}
	};

	return (
		<div className="bg-gradient-to-r from-plum-purple/5 via-white to-honey-yellow/5 border border-gray-200 rounded-3xl p-6 mb-8 animate-fade-in-up shadow-lg backdrop-blur-md">
			{/* Header Section with Day Navigation */}
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
				{/* Day Navigation Title */}
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 bg-gradient-to-r from-plum-purple to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
						<Calendar size={24} className="text-white" />
					</div>
					<div>
						<h2
							className="text-xl font-bold text-plum-purple bg-gradient-to-r from-plum-purple to-purple-600 bg-clip-text"
							style={{
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}>
							Gallery Collections
						</h2>
						<p className="text-sm text-gray-600">
							Browse by day • Search • Filter • Download
						</p>
					</div>
				</div>

				{/* Day Navigation Controls */}
				<div className="flex items-center gap-3 flex-wrap">
					{/* Mobile day navigation for selected day */}
					{selectedDay !== null && (
						<div className="flex items-center gap-2 lg:hidden bg-white/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200">
							<button
								onClick={handlePrevDay}
								disabled={availableDays.indexOf(selectedDay) === 0}
								className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center
								         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
								<ChevronLeft size={16} />
							</button>
							<span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
								Day {selectedDay}
							</span>
							<button
								onClick={handleNextDay}
								disabled={
									availableDays.indexOf(selectedDay) === availableDays.length - 1
								}
								className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center
								         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
								<ChevronRight size={16} />
							</button>
						</div>
					)}

					{/* Show All button */}
					<button
						onClick={() => onDaySelect(null)}
						className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
							selectedDay === null
								? "bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg shadow-plum-purple/25"
								: "bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200"
						}`}>
						All Days
					</button>
				</div>
			</div>

			{/* Day Pills Navigation - hidden on mobile when day is selected */}
			<div
				className={`mb-6 ${selectedDay !== null ? "hidden lg:block" : "block"}`}>
				<div className="flex flex-wrap gap-2">
					{availableDays.map((day) => (
						<button
							key={day}
							onClick={() => onDaySelect(day)}
							className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105
							         ${
																	selectedDay === day
																		? "bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg shadow-plum-purple/25"
																		: "bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200"
																}`}>
							<span>Day {day}</span>
							{imageCountsByDay[day] && (
								<span
									className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
										selectedDay === day
											? "bg-white/20 text-white"
											: "bg-plum-purple/10 text-plum-purple"
									}`}>
									{imageCountsByDay[day]}
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Actions and Controls */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
					{/* Left side: Favorites toggle and selection info */}
					<div className="flex items-center gap-3 flex-wrap">
						<button
							onClick={onToggleFavorites}
							className={`px-4 py-2.5 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium
                        ${
																									showFavoritesOnly
																										? "bg-gradient-to-r from-red-500 to-pink-500 border-red-400 text-white shadow-lg shadow-red-500/25"
																										: "bg-white/70 backdrop-blur-sm border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
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

						{/* Selection info */}
						{selectedImages.length > 0 && (
							<div className="flex items-center gap-2 bg-plum-purple/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-plum-purple/20">
								<span className="text-sm font-medium text-plum-purple">
									{selectedImages.length} selected
								</span>
								<button
									onClick={onClearSelection}
									className="text-xs text-plum-purple/70 hover:text-plum-purple underline transition-colors"
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
							className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2
                        ${
																									selectedImages.length > 0
																										? "bg-gradient-to-r from-plum-purple to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-plum-purple/25"
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
				{showFavoritesOnly && (
					<div className="pt-4 border-t border-gray-200/50">
						<div className="flex flex-wrap gap-2 items-center">
							<span className="text-sm text-gray-600 font-medium">
								Active filters:
							</span>

							{showFavoritesOnly && (
								<span className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium border border-red-200">
									♥ Favorites Only
								</span>
							)}

							<button
								onClick={() => {
									if (showFavoritesOnly) onToggleFavorites();
								}}
								className="text-sm text-gray-500 hover:text-gray-700 underline ml-2 transition-colors duration-200">
								Clear all filters
							</button>
						</div>
					</div>
				)}

				{/* Selected day info with desktop navigation */}
				{selectedDay !== null && (
					<div className="pt-4 border-t border-gray-200/50">
						<div className="flex items-center justify-between bg-gradient-to-r from-plum-purple/5 to-purple-600/5 rounded-xl p-4 border border-plum-purple/10 backdrop-blur-sm">
							<div>
								<h3 className="font-semibold text-gray-800">
									Day {selectedDay} Collection
								</h3>
								<p className="text-sm text-gray-600">
									{imageCountsByDay[selectedDay] || 0} images in this day
								</p>
							</div>

							{/* Desktop navigation */}
							<div className="hidden lg:flex items-center gap-2">
								<button
									onClick={handlePrevDay}
									disabled={availableDays.indexOf(selectedDay) === 0}
									className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-300 flex items-center justify-center
									         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm">
									<ChevronLeft size={18} />
								</button>
								<button
									onClick={handleNextDay}
									disabled={
										availableDays.indexOf(selectedDay) === availableDays.length - 1
									}
									className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-300 flex items-center justify-center
									         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm">
									<ChevronRight size={18} />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DayNavigationWithFeatures;
