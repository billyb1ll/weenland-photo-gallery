"use client";

import React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DayNavigationProps {
	selectedDay: number | null;
	availableDays: number[];
	onDaySelect: (day: number | null) => void;
	imageCountsByDay: Record<number, number>;
}

const DayNavigation: React.FC<DayNavigationProps> = ({
	selectedDay,
	availableDays,
	onDaySelect,
	imageCountsByDay,
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
		<div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				{/* Title */}
				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 bg-gradient-to-r from-plum-purple to-purple-600 rounded-xl 
					            flex items-center justify-center">
						<Calendar size={20} className="text-white" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-gray-800">Gallery Days</h2>
						<p className="text-sm text-gray-600">Browse images by day collection</p>
					</div>
				</div>

				{/* Navigation Controls */}
				<div className="flex items-center gap-3">
					{/* Previous/Next buttons for mobile */}
					{selectedDay !== null && (
						<div className="flex items-center gap-2 sm:hidden">
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
						className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
							selectedDay === null
								? "bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}>
						All Days
					</button>
				</div>
			</div>

			{/* Day selector pills - hidden on mobile when a day is selected */}
			<div
				className={`mt-4 ${selectedDay !== null ? "hidden sm:block" : "block"}`}>
				<div className="flex flex-wrap gap-2">
					{availableDays.map((day) => (
						<button
							key={day}
							onClick={() => onDaySelect(day)}
							className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-200 
							         ${
																	selectedDay === day
																		? "bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg transform scale-105"
																		: "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:transform hover:scale-105"
																}`}>
							<span>Day {day}</span>
							{imageCountsByDay[day] && (
								<span
									className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
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

			{/* Selected day info */}
			{selectedDay !== null && (
				<div className="mt-4 p-4 bg-gradient-to-r from-plum-purple/5 to-purple-600/5 rounded-xl border border-plum-purple/10">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium text-gray-800">
								Day {selectedDay} Collection
							</h3>
							<p className="text-sm text-gray-600">
								{imageCountsByDay[selectedDay] || 0} images in this day
							</p>
						</div>

						{/* Desktop navigation */}
						<div className="hidden sm:flex items-center gap-2">
							<button
								onClick={handlePrevDay}
								disabled={availableDays.indexOf(selectedDay) === 0}
								className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center
								         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
								<ChevronLeft size={16} />
							</button>
							<button
								onClick={handleNextDay}
								disabled={
									availableDays.indexOf(selectedDay) === availableDays.length - 1
								}
								className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center
								         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DayNavigation;
