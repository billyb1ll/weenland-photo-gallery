"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
	Download,
	Heart,
	Check,
	Edit3,
	Trash2,
	Save,
	X,
	Star,
} from "lucide-react";

interface AdminGalleryCardProps {
	id: number;
	thumbnailUrl: string;
	fullUrl: string;
	title: string;
	day?: number;
	isFavorite: boolean;
	isSelected: boolean;
	isAdmin: boolean;
	isHighlight?: boolean;
	onFavoriteToggle: (id: number) => void;
	onSelect: (id: number) => void;
	onImageClick: (id: number) => void;
	onDownload: (fullUrl: string, filename: string) => void;
	onUpdateImage?: (
		id: number,
		updates: { day?: number; title?: string; isHighlight?: boolean }
	) => void;
	onDeleteImage?: (id: number) => void;
}

const AdminGalleryCard: React.FC<AdminGalleryCardProps> = ({
	id,
	thumbnailUrl,
	fullUrl,
	title,
	day,
	isFavorite,
	isSelected,
	isAdmin,
	isHighlight = false,
	onFavoriteToggle,
	onSelect,
	onImageClick,
	onDownload,
	onUpdateImage,
	onDeleteImage,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({
		day: day || 1,
		title: title || "",
		isHighlight: isHighlight,
	});
	const [isDeleting, setIsDeleting] = useState(false);

	const handleSave = async () => {
		if (onUpdateImage) {
			const updates = {
				day: editData.day,
				title: editData.title,
				isHighlight: editData.isHighlight,
			};
			await onUpdateImage(id, updates);
		}
		setIsEditing(false);
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		setIsDeleting(true);
		if (onDeleteImage) {
			await onDeleteImage(id);
		}
		setIsDeleting(false);
	};

	const handleCancel = () => {
		setEditData({
			day: day || 1,
			title: title || "",
			isHighlight: isHighlight,
		});
		setIsEditing(false);
	};

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
					alt={title || `Image ${id}`}
					fill
					className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
					onClick={() => onImageClick(id)}
					sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
				/>

				{/* Overlay gradient */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				{/* Top left - Selection checkbox */}
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

				{/* Top right - Favorite and Highlight buttons */}
				<div className="absolute top-2 right-2 z-10 flex items-center gap-1">
					{/* Highlight Star (visible for everyone) */}
					{isHighlight && (
						<div className="w-7 h-7 rounded-xl flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-400/30 animate-pulse">
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

				{/* Bottom left - ID and day */}
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

				{/* Bottom right - Admin actions */}
				<div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
					<div className="flex items-center gap-1">
						{/* Download button (for non-admin or when not editing) */}
						{(!isAdmin || !isEditing) && (
							<button
								onClick={() => onDownload(fullUrl, title || `image-${id}`)}
								className="w-7 h-7 bg-green-500/90 text-white rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-sm hover:bg-green-600"
								aria-label="Download image">
								<Download size={14} strokeWidth={2} />
							</button>
						)}

						{/* Admin controls */}
						{isAdmin && !isEditing && (
							<>
								<button
									onClick={() => setIsEditing(true)}
									className="w-7 h-7 bg-blue-500/90 text-white rounded-lg backdrop-blur-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
									title="Edit image">
									<Edit3 size={14} />
								</button>
								<button
									onClick={handleDelete}
									disabled={isDeleting}
									className="w-7 h-7 bg-red-500/90 text-white rounded-lg backdrop-blur-sm hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50"
									title="Delete image">
									{isDeleting ? (
										<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									) : (
										<Trash2 size={14} />
									)}
								</button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Simple inline editing below image */}
			{isAdmin && isEditing && (
				<div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2">
					{/* Quick edit header */}
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
							<Edit3 size={12} />
							Quick Edit
						</span>
						<div className="flex gap-1">
							<button
								onClick={handleSave}
								className="w-6 h-6 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center"
								title="Save changes">
								<Save size={10} />
							</button>
							<button
								onClick={handleCancel}
								className="w-6 h-6 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center"
								title="Cancel">
								<X size={10} />
							</button>
						</div>
					</div>

					{/* Simplified edit form */}
					<div className="grid grid-cols-2 gap-2">
						{/* Day selector */}
						<div>
							<label className="text-xs text-gray-600 mb-1 block">Day</label>
							<select
								value={editData.day}
								onChange={(e) =>
									setEditData({ ...editData, day: Number(e.target.value) })
								}
								className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-plum-purple">
								{Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => (
									<option key={dayNum} value={dayNum}>
										{dayNum}
									</option>
								))}
							</select>
						</div>

						{/* Title */}
						<div>
							<label className="text-xs text-gray-600 mb-1 block">Title</label>
							<input
								type="text"
								value={editData.title}
								onChange={(e) => setEditData({ ...editData, title: e.target.value })}
								className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-plum-purple"
								placeholder="Image title"
							/>
						</div>
					</div>

					{/* Highlight Toggle */}
					<div className="flex items-center justify-between">
						<label className="text-xs text-gray-600 flex items-center gap-1">
							<Star size={12} className="text-yellow-500" /> Highlight Image
						</label>
						<button
							type="button"
							onClick={() =>
								setEditData({ ...editData, isHighlight: !editData.isHighlight })
							}
							className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${
								editData.isHighlight
									? "bg-gradient-to-r from-yellow-400 to-amber-500"
									: "bg-gray-300"
							}`}>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
									editData.isHighlight ? "translate-x-4" : "translate-x-0.5"
								} mt-0.5`}
							/>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminGalleryCard;
