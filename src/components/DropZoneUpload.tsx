"use client";

import React, { useState, useRef, DragEvent } from "react";
import {
	Upload,
	X,
	Image as ImageIcon,
	Check,
	AlertCircle,
} from "lucide-react";

interface DropZoneUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onUpload: (files: File[], day: number) => Promise<void>;
	currentDay: number;
}

interface FilePreview {
	file: File;
	id: string;
	preview: string;
	status: "pending" | "uploading" | "success" | "error";
	progress?: number;
	error?: string;
}

const DropZoneUpload: React.FC<DropZoneUploadProps> = ({
	isOpen,
	onClose,
	onUpload,
	currentDay,
}) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const [selectedDay, setSelectedDay] = useState(currentDay);
	const [files, setFiles] = useState<FilePreview[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);

		const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
			file.type.startsWith("image/")
		);

		addFiles(droppedFiles);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFiles = Array.from(e.target.files);
			addFiles(selectedFiles);
		}
	};

	const addFiles = (newFiles: File[]) => {
		const filesPreviews: FilePreview[] = newFiles.map((file) => ({
			file,
			id: Math.random().toString(36).substr(2, 9),
			preview: URL.createObjectURL(file),
			status: "pending",
		}));

		setFiles((prev) => [...prev, ...filesPreviews]);
	};

	const removeFile = (id: string) => {
		setFiles((prev) => {
			const updated = prev.filter((f) => f.id !== id);
			// Clean up object URLs
			const removed = prev.find((f) => f.id === id);
			if (removed) {
				URL.revokeObjectURL(removed.preview);
			}
			return updated;
		});
	};

	const handleUpload = async () => {
		if (files.length === 0) return;

		setIsUploading(true);

		try {
			// Update all files to uploading status
			setFiles((prev) =>
				prev.map((f) => ({ ...f, status: "uploading" as const, progress: 0 }))
			);

			const filesToUpload = files.map((f) => f.file);
			await onUpload(filesToUpload, selectedDay);

			// Update all files to success status
			setFiles((prev) =>
				prev.map((f) => ({ ...f, status: "success" as const, progress: 100 }))
			);

			// Close modal after a short delay
			setTimeout(() => {
				handleClose();
			}, 1500);
		} catch (error) {
			// Update all files to error status
			setFiles((prev) =>
				prev.map((f) => ({
					...f,
					status: "error" as const,
					error: error instanceof Error ? error.message : "Upload failed",
				}))
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleClose = () => {
		// Clean up object URLs
		files.forEach((file) => URL.revokeObjectURL(file.preview));
		setFiles([]);
		setIsDragOver(false);
		setIsUploading(false);
		onClose();
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
				{/* Header */}
				<div className="bg-gradient-to-r from-plum-purple to-purple-600 text-white p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
								<Upload size={20} />
							</div>
							<div>
								<h2 className="text-xl font-bold">Upload Images</h2>
								<p className="text-white/80 text-sm">
									Drag and drop images or click to select
								</p>
							</div>
						</div>
						<button
							onClick={handleClose}
							disabled={isUploading}
							className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
							<X size={18} />
						</button>
					</div>

					{/* Day Selector */}
					<div className="mt-4 flex items-center gap-3">
						<label className="text-white/90 font-medium">Upload to:</label>
						<select
							value={selectedDay}
							onChange={(e) => setSelectedDay(Number(e.target.value))}
							disabled={isUploading}
							className="bg-white/20 text-white px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50">
							{Array.from({ length: 3 }, (_, i) => i + 1).map((day) => (
								<option key={day} value={day} className="text-gray-800">
									Day {day}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
					{/* Drop Zone */}
					{files.length === 0 && (
						<div
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
								isDragOver
									? "border-plum-purple bg-plum-purple/5 scale-105"
									: "border-gray-300 hover:border-plum-purple hover:bg-plum-purple/5"
							}`}>
							<div className="flex flex-col items-center gap-4">
								<div
									className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
										isDragOver ? "bg-plum-purple text-white" : "bg-gray-100 text-gray-400"
									}`}>
									<ImageIcon size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-800 mb-2">
										{isDragOver ? "Drop images here" : "Drag and drop images"}
									</h3>
									<p className="text-gray-600 mb-4">
										Support: JPG, PNG, GIF, WebP • Max 10MB per file
									</p>
									<button
										onClick={() => fileInputRef.current?.click()}
										className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium">
										Browse Files
									</button>
								</div>
							</div>
						</div>
					)}

					{/* File Previews */}
					{files.length > 0 && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold text-gray-800">
									Selected Images ({files.length})
								</h3>
								{!isUploading && (
									<button
										onClick={() => fileInputRef.current?.click()}
										className="text-plum-purple hover:text-purple-600 font-medium transition-colors">
										Add More
									</button>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{files.map((filePreview) => (
									<div
										key={filePreview.id}
										className="bg-gray-50 rounded-lg p-3 relative">
										{/* Remove button */}
										{!isUploading && (
											<button
												onClick={() => removeFile(filePreview.id)}
												className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10">
												<X size={12} />
											</button>
										)}

										{/* Image Preview */}
										<div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={filePreview.preview}
												alt={filePreview.file.name}
												className="w-full h-full object-cover"
											/>
										</div>

										{/* File Info */}
										<div className="space-y-2">
											<p className="text-sm font-medium text-gray-800 truncate">
												{filePreview.file.name}
											</p>
											<p className="text-xs text-gray-500">
												{formatFileSize(filePreview.file.size)}
											</p>

											{/* Status */}
											<div className="flex items-center gap-2">
												{filePreview.status === "pending" && (
													<span className="text-xs text-gray-500">Ready to upload</span>
												)}
												{filePreview.status === "uploading" && (
													<>
														<div className="w-3 h-3 border-2 border-plum-purple/30 border-t-plum-purple rounded-full animate-spin" />
														<span className="text-xs text-plum-purple">Uploading...</span>
													</>
												)}
												{filePreview.status === "success" && (
													<>
														<Check size={12} className="text-green-500" />
														<span className="text-xs text-green-500">Uploaded</span>
													</>
												)}
												{filePreview.status === "error" && (
													<>
														<AlertCircle size={12} className="text-red-500" />
														<span className="text-xs text-red-500">Failed</span>
													</>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
					/>
				</div>

				{/* Footer */}
				{files.length > 0 && (
					<div className="border-t bg-gray-50 p-6">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-600">
								{files.length} image{files.length !== 1 ? "s" : ""} selected • Day{" "}
								{selectedDay}
							</div>
							<div className="flex gap-3">
								<button
									onClick={handleClose}
									disabled={isUploading}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
									Cancel
								</button>
								<button
									onClick={handleUpload}
									disabled={isUploading || files.length === 0}
									className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center gap-2">
									{isUploading ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload size={16} />
											Upload Images
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DropZoneUpload;
