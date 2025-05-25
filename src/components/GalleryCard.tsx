"use client";

import React from "react";
import Image from "next/image";
import { Download, Heart, Check, Star } from "lucide-react";

interface GalleryCardProps {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	day?: number;
	isFavorite: boolean;
	isSelected: boolean;
	isHighlight?: boolean;
	onFavoriteToggle: (id: number) => void;
	onSelect: (id: number) => void;
	onImageClick: (id: number) => void;
	onDownload: (fullUrl: string, filename: string) => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
	id,
	thumbnailUrl,
	fullUrl,
	day,
	isFavorite,
	isSelected,
	isHighlight = false,
	onFavoriteToggle,
	onSelect,
	onImageClick,
	onDownload,
}) => {
	return (
		<div
			className={`group relative bg-white border ${
				isHighlight ? "border-yellow-400 border-2" : "border-gray-200"
			} rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl ${
				isHighlight ? "hover:border-yellow-500" : "hover:border-gray-300"
			}
                        ${
																									isSelected
																										? "ring-2 ring-plum-purple ring-opacity-60 shadow-lg shadow-plum-purple/20"
																										: isHighlight
																										? "shadow-md shadow-yellow-200/50"
																										: "shadow-sm"
																								}`}>
			{/* Image container */}
			<div className="relative aspect-square overflow-hidden">
				<Image
					src={thumbnailUrl}
					alt={`Image ${id}`}
					fill
					className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
					onClick={() => onImageClick(id)}
					sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
				/>

				{/* Overlay gradient */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				{/* Selection checkbox */}
				<div className="absolute top-2 left-2 z-10">
					<button
						onClick={() => onSelect(id)}
						className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-sm
                                  ${
																																			isSelected
																																				? "bg-plum-purple border-plum-purple text-white shadow-lg shadow-plum-purple/40"
																																				: "bg-white/90 border-white/60 hover:border-plum-purple hover:bg-plum-purple/10"
																																		}`}
						aria-label={isSelected ? "Deselect image" : "Select image"}>
						{isSelected && <Check size={14} strokeWidth={3} />}
					</button>
				</div>

				{/* Top right buttons container */}
				<div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
					{/* Highlight star */}
					{isHighlight && (
						<div className="w-7 h-7 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-yellow-400/30 animate-pulse">
							<Star size={16} fill="white" strokeWidth={0} />
						</div>
					)}

					{/* Favorite button */}
					<button
						onClick={() => onFavoriteToggle(id)}
						className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm
                                  ${
																																			isFavorite
																																				? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/40"
																																				: "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
																																		}`}
						aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
						<Heart
							size={16}
							fill={isFavorite ? "currentColor" : "none"}
							strokeWidth={isFavorite ? 0 : 2}
						/>
					</button>
				</div>

				{/* Image ID and Day badge */}
				<div className="absolute bottom-2 left-2 z-10">
					<div className="flex items-center gap-1.5">
						<span className="bg-black/80 text-white text-xs font-mono px-2 py-1 rounded-md backdrop-blur-sm">
							#{id}
						</span>
						{day && (
							<span className="bg-plum-purple/80 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
								D{day}
							</span>
						)}
					</div>
				</div>

				{/* Download button (appears on hover) */}
				<div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
					<button
						onClick={() => onDownload(fullUrl, `image-${id}`)}
						className="w-7 h-7 bg-green-500/90 text-white rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-sm hover:bg-green-600"
						aria-label={`Download image ${id}`}>
						<Download size={14} strokeWidth={2} />
					</button>
				</div>
			</div>

			{/* Mobile download button */}
			<div className="p-4 sm:p-5 flex justify-center sm:hidden">
				<button
					onClick={() => onDownload(fullUrl, `image-${id}`)}
					className="bg-plum-purple text-white rounded-lg px-4 py-2 hover:bg-purple-700 
                             transition-colors duration-200 flex items-center gap-2 font-medium"
					aria-label={`Download image ${id}`}>
					<Download size={14} />
					<span>Download</span>
				</button>
			</div>

			{/* Selection indicator overlay */}
			{isSelected && (
				<div className="absolute inset-0 bg-plum-purple/10 border-2 border-plum-purple rounded-xl pointer-events-none" />
			)}
		</div>
	);
};

export default GalleryCard;
