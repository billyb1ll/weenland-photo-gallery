"use client";

import React, { useState, useRef, useCallback } from "react";
import {
	Upload,
	X,
	Folder,
	Image as ImageIcon,
	Check,
	AlertCircle,
	FileImage,
	Trash2,
	Play,
	Pause,
} from "lucide-react";

interface FolderUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onUploadComplete: () => void;
	currentDay: number;
}

interface FilePreview {
	file: File;
	id: string;
	preview?: string;
	status: "pending" | "uploading" | "success" | "error";
	progress?: number;
	error?: string;
	dimensions?: { width: number; height: number };
	uploadStartTime?: number;
	uploadEndTime?: number;
	transferSpeed?: number; // bytes per second
}

interface UploadStats {
	total: number;
	uploaded: number;
	failed: number;
	currentFile?: string;
}

const FolderUpload: React.FC<FolderUploadProps> = ({
	isOpen,
	onClose,
	onUploadComplete,
	currentDay,
}) => {
	const [selectedDay, setSelectedDay] = useState(currentDay);
	const [files, setFiles] = useState<FilePreview[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [uploadStats, setUploadStats] = useState<UploadStats>({
		total: 0,
		uploaded: 0,
		failed: 0,
	});
	const [showPreview, setShowPreview] = useState(false);
	const [selectedPreviewFile, setSelectedPreviewFile] =
		useState<FilePreview | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);

	const folderInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Handle folder selection (webkitdirectory)
	const handleFolderSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				const selectedFiles = Array.from(e.target.files).filter((file) =>
					file.type.startsWith("image/")
				);
				processFiles(selectedFiles);
			}
		},
		[]
	);

	// Handle individual file selection
	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				const selectedFiles = Array.from(e.target.files).filter((file) =>
					file.type.startsWith("image/")
				);
				processFiles(selectedFiles);
			}
		},
		[]
	);

	// Handle drag and drop
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);

		const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
			file.type.startsWith("image/")
		);
		processFiles(droppedFiles);
	}, []);

	// Process selected files
	const processFiles = async (newFiles: File[]) => {
		console.log(`📁 Processing ${newFiles.length} files...`);

		const filePreviews: FilePreview[] = await Promise.all(
			newFiles.map(async (file, index) => {
				const id = `${Date.now()}_${index}_${Math.random()
					.toString(36)
					.substr(2, 9)}`;

				// Create preview for first 100 files to avoid memory issues
				let preview: string | undefined;
				let dimensions: { width: number; height: number } | undefined;

				if (index < 100) {
					try {
						preview = URL.createObjectURL(file);
						// Get image dimensions
						const img = new Image();
						img.src = preview;
						await new Promise((resolve) => {
							img.onload = () => {
								dimensions = { width: img.width, height: img.height };
								resolve(void 0);
							};
							img.onerror = () => resolve(void 0);
						});
					} catch (error) {
						console.warn(`Failed to create preview for ${file.name}:`, error);
					}
				}

				return {
					file,
					id,
					preview,
					status: "pending" as const,
					dimensions,
				};
			})
		);

		setFiles((prev) => [...prev, ...filePreviews]);
		console.log(`✅ Processed ${filePreviews.length} files`);
	};

	// Remove a file from the list
	const removeFile = (id: string) => {
		setFiles((prev) => {
			const updated = prev.filter((f) => f.id !== id);
			// Clean up object URLs
			const removed = prev.find((f) => f.id === id);
			if (removed?.preview) {
				URL.revokeObjectURL(removed.preview);
			}
			return updated;
		});
	};

	// Clear all files
	const clearAllFiles = () => {
		files.forEach((file) => {
			if (file.preview) {
				URL.revokeObjectURL(file.preview);
			}
		});
		setFiles([]);
		setUploadStats({ total: 0, uploaded: 0, failed: 0 });
	};

	// Start upload process
	const handleUpload = async () => {
		if (files.length === 0) return;

		setIsUploading(true);
		setIsPaused(false);
		setUploadStats({ total: files.length, uploaded: 0, failed: 0 });

		// Create abort controller for cancellation
		abortControllerRef.current = new AbortController();

		try {
			// Process files in smaller batches to avoid timeout
			const BATCH_SIZE = 25;
			let uploadedCount = 0;
			let failedCount = 0;

			for (let i = 0; i < files.length; i += BATCH_SIZE) {
				// Check if upload was paused or cancelled
				if (isPaused || abortControllerRef.current?.signal.aborted) {
					console.log("Upload paused or cancelled");
					break;
				}

				const batch = files.slice(i, i + BATCH_SIZE);
				console.log(
					`📦 Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
						files.length / BATCH_SIZE
					)}`
				);

				// Update files to uploading status
				setFiles((prev) =>
					prev.map((f) =>
						batch.find((b) => b.id === f.id)
							? {
									...f,
									status: "uploading" as const,
									progress: 0,
									uploadStartTime: Date.now(),
							  }
							: f
					)
				);

				// Process each file in the batch with individual progress tracking
				const batchResults = await Promise.all(
					batch.map(async (filePreview) => {
						try {
							const result = await uploadFileWithProgress(filePreview, selectedDay);
							if (result.success) {
								uploadedCount++;
								return {
									id: filePreview.id,
									status: "success" as const,
									uploadEndTime: Date.now(),
									transferSpeed: result.transferSpeed,
								};
							} else {
								failedCount++;
								return {
									id: filePreview.id,
									status: "error" as const,
									error: result.error,
								};
							}
						} catch (error) {
							failedCount++;
							return {
								id: filePreview.id,
								status: "error" as const,
								error: error instanceof Error ? error.message : "Upload failed",
							};
						}
					})
				);

				// Update file statuses based on results
				setFiles((prev) =>
					prev.map((f) => {
						const result = batchResults.find((r) => r.id === f.id);
						if (!result) return f;

						return {
							...f,
							...result,
							progress: result.status === "success" ? 100 : f.progress,
						};
					})
				);

				setUploadStats((prev) => ({
					...prev,
					uploaded: uploadedCount,
					failed: failedCount,
				}));

				// Small delay between batches
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			// Upload completed
			console.log(
				`✅ Upload completed: ${uploadedCount} successful, ${failedCount} failed`
			);

			if (uploadedCount > 0) {
				// Sync images to ensure consistency between regular and bulk uploads
				try {
					const syncResponse = await fetch("/api/sync?useFilenames=true", {
						method: "POST",
						signal: abortControllerRef.current?.signal,
					});

					if (syncResponse.ok) {
						console.log("✅ Images synced after upload");
					} else {
						console.error(
							"❌ Failed to sync images after upload:",
							await syncResponse.text()
						);
					}

					// Also clear the images cache to ensure fresh data
					await fetch("/api/images", {
						method: "POST",
						signal: abortControllerRef.current?.signal,
					});
					console.log("🔄 Images cache cleared");
				} catch (error) {
					console.error("Failed to sync images after upload:", error);
				}

				onUploadComplete();
			}
		} catch (error) {
			console.error("Upload process failed:", error);
		} finally {
			setIsUploading(false);
			abortControllerRef.current = null;
		}
	};

	// Upload a single file with progress tracking
	const uploadFileWithProgress = (
		filePreview: FilePreview,
		day: number
	): Promise<{
		success: boolean;
		error?: string;
		transferSpeed?: number;
	}> => {
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest();
			const formData = new FormData();

			// Add the file to form data
			formData.append("files[0]", filePreview.file);
			formData.append("day", day.toString());

			// Track upload progress
			xhr.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable) {
					const percentComplete = Math.round((event.loaded / event.total) * 100);

					// Calculate transfer speed (bytes/second)
					const elapsedTime =
						(Date.now() - (filePreview.uploadStartTime || Date.now())) / 1000;
					const transferSpeed = elapsedTime > 0 ? event.loaded / elapsedTime : 0;

					// Update file status with progress
					setFiles((prev) =>
						prev.map((f) =>
							f.id === filePreview.id
								? {
										...f,
										progress: percentComplete,
										transferSpeed,
								  }
								: f
						)
					);

					// Update current file in upload stats
					setUploadStats((prev) => ({
						...prev,
						currentFile: filePreview.file.name,
					}));
				}
			});

			// Handle upload completion
			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						JSON.parse(xhr.responseText);
						// Calculate final transfer speed
						const elapsedTime =
							(Date.now() - (filePreview.uploadStartTime || Date.now())) / 1000;
						const transferSpeed =
							elapsedTime > 0 ? filePreview.file.size / elapsedTime : 0;

						resolve({
							success: true,
							transferSpeed,
						});
					} catch {
						resolve({
							success: false,
							error: "Invalid response from server",
						});
					}
				} else {
					try {
						const response = JSON.parse(xhr.responseText);
						resolve({
							success: false,
							error: response.error || `HTTP error: ${xhr.status}`,
						});
					} catch {
						resolve({
							success: false,
							error: `HTTP error: ${xhr.status}`,
						});
					}
				}
			});

			// Handle network errors
			xhr.addEventListener("error", () => {
				resolve({
					success: false,
					error: "Network error occurred during upload",
				});
			});

			// Handle abort
			xhr.addEventListener("abort", () => {
				resolve({
					success: false,
					error: "Upload was aborted",
				});
			});

			// Set up timeout handler
			xhr.timeout = 300000; // 5 minutes timeout
			xhr.addEventListener("timeout", () => {
				resolve({
					success: false,
					error: "Upload timed out",
				});
			});

			// Send the request
			xhr.open("POST", "/api/upload/bulk", true);
			xhr.send(formData);

			// Store the XHR object for potential abort
			const abort = () => xhr.abort();

			// Add abort listener for our abort controller
			if (abortControllerRef.current) {
				abortControllerRef.current.signal.addEventListener("abort", abort);
			}
		});
	};

	// Pause/Resume upload
	const togglePause = () => {
		setIsPaused(!isPaused);
	};

	// Cancel upload
	const cancelUpload = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		setIsUploading(false);
		setIsPaused(false);
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// Format transfer speed in readable units
	const formatTransferSpeed = (bytesPerSecond: number): string => {
		if (bytesPerSecond === 0) return "0 B/s";
		if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
		if (bytesPerSecond < 1024 * 1024)
			return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
		return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`;
	};

	const handleClose = () => {
		if (isUploading) {
			cancelUpload();
		}

		// Clean up object URLs
		files.forEach((file) => {
			if (file.preview) {
				URL.revokeObjectURL(file.preview);
			}
		});

		setFiles([]);
		setUploadStats({ total: 0, uploaded: 0, failed: 0 });
		setSelectedPreviewFile(null);
		setShowPreview(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
				{/* Header */}
				<div className="bg-gradient-to-r from-plum-purple to-purple-600 text-white p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
								<Folder size={24} />
							</div>
							<div>
								<h2 className="text-2xl font-bold">Massive Folder Upload</h2>
								<p className="text-white/80 text-sm">
									Upload entire folders with unlimited file sizes • Original quality
									preserved
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{/* Day selector */}
							<select
								value={selectedDay}
								onChange={(e) => setSelectedDay(Number(e.target.value))}
								disabled={isUploading}
								className="bg-white/20 text-white px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50">
								{Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
									<option key={day} value={day} className="text-gray-800">
										Day {day}
									</option>
								))}
							</select>
							<button
								onClick={handleClose}
								disabled={isUploading}
								className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
								<X size={20} />
							</button>
						</div>
					</div>

					{/* Upload stats */}
					{files.length > 0 && (
						<div className="mt-4 flex items-center gap-6 text-sm">
							<span>📁 {files.length} files selected</span>
							<span>
								💾{" "}
								{files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024 / 1024 > 1
									? `${(
											files.reduce((acc, f) => acc + f.file.size, 0) /
											1024 /
											1024 /
											1024
									  ).toFixed(2)} GB`
									: `${(
											files.reduce((acc, f) => acc + f.file.size, 0) /
											1024 /
											1024
									  ).toFixed(2)} MB`}
							</span>
							{isUploading && (
								<span>
									📤 {uploadStats.uploaded}/{uploadStats.total} uploaded
								</span>
							)}
						</div>
					)}
				</div>

				{/* Content */}
				<div className="flex h-[calc(95vh-200px)]">
					{/* Main upload area */}
					<div className="flex-1 p-6 overflow-y-auto">
						{files.length === 0 ? (
							/* Drop zone */
							<div
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 h-full flex flex-col items-center justify-center ${
									isDragOver
										? "border-plum-purple bg-plum-purple/5 scale-105"
										: "border-gray-300 hover:border-plum-purple hover:bg-plum-purple/5"
								}`}>
								<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
									<Folder size={32} className="text-gray-400" />
								</div>
								<h3 className="text-xl font-semibold text-gray-800 mb-2">
									{isDragOver ? "Drop folder here" : "Select Folder or Files"}
								</h3>
								<p className="text-gray-600 mb-6 max-w-md">
									Upload entire folders with 1000+ images. All formats supported.
									Original quality preserved. No file size limits.
								</p>
								<div className="flex gap-4">
									<button
										onClick={() => folderInputRef.current?.click()}
										className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center gap-2">
										<Folder size={20} />
										Select Folder
									</button>
									<button
										onClick={() => fileInputRef.current?.click()}
										className="border border-plum-purple text-plum-purple px-6 py-3 rounded-lg hover:bg-plum-purple hover:text-white transition-all duration-200 font-medium flex items-center gap-2">
										<FileImage size={20} />
										Select Files
									</button>
								</div>
							</div>
						) : (
							/* File list */
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold text-gray-800">
										Selected Images ({files.length})
									</h3>
									<div className="flex gap-2">
										{!isUploading && (
											<>
												<button
													onClick={() => folderInputRef.current?.click()}
													className="text-plum-purple hover:text-purple-600 font-medium transition-colors flex items-center gap-1">
													<Folder size={16} />
													Add Folder
												</button>
												<button
													onClick={() => fileInputRef.current?.click()}
													className="text-plum-purple hover:text-purple-600 font-medium transition-colors flex items-center gap-1">
													<FileImage size={16} />
													Add Files
												</button>
												<button
													onClick={clearAllFiles}
													className="text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1">
													<Trash2 size={16} />
													Clear All
												</button>
											</>
										)}
									</div>
								</div>

								{/* File grid */}
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
									{files.map((filePreview) => (
										<div
											key={filePreview.id}
											className="bg-gray-50 rounded-lg p-2 relative group">
											{/* Remove button */}
											{!isUploading && (
												<button
													onClick={() => removeFile(filePreview.id)}
													className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100">
													<X size={10} />
												</button>
											)}{" "}
											{/* Preview or placeholder */}
											<div className="w-full h-20 bg-gray-200 rounded overflow-hidden mb-2">
												{filePreview.preview ? (
													/* eslint-disable-next-line @next/next/no-img-element */
													<img
														src={filePreview.preview}
														alt={filePreview.file.name}
														className="w-full h-full object-cover cursor-pointer"
														onClick={() => {
															setSelectedPreviewFile(filePreview);
															setShowPreview(true);
														}}
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<ImageIcon size={24} className="text-gray-400" />
													</div>
												)}

												{/* Progress overlay for uploading files */}
												{filePreview.status === "uploading" &&
													filePreview.progress !== undefined && (
														<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
															<div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold">
																{filePreview.progress}%
															</div>
														</div>
													)}
											</div>
											{/* File info */}
											<div className="text-xs">
												<p
													className="font-medium text-gray-800 truncate"
													title={filePreview.file.name}>
													{filePreview.file.name}
												</p>
												<p className="text-gray-500">
													{formatFileSize(filePreview.file.size)}
												</p>
												{filePreview.dimensions && (
													<p className="text-gray-500">
														{filePreview.dimensions.width}×{filePreview.dimensions.height}
													</p>
												)}

												{/* Status */}
												<div className="flex items-center gap-1 mt-1">
													{filePreview.status === "pending" && (
														<span className="text-gray-500">Ready</span>
													)}
													{filePreview.status === "uploading" && (
														<>
															{filePreview.progress !== undefined ? (
																<div className="w-full">
																	<div className="flex items-center justify-between">
																		<span className="text-plum-purple text-xs">
																			Uploading {filePreview.progress}%
																		</span>
																		{filePreview.transferSpeed && (
																			<span className="text-xs text-gray-500">
																				{formatTransferSpeed(filePreview.transferSpeed)}
																			</span>
																		)}
																	</div>
																	<div className="w-full bg-gray-200 h-1 rounded-full mt-1">
																		<div
																			className="bg-plum-purple h-1 rounded-full transition-all duration-300"
																			style={{ width: `${filePreview.progress}%` }}
																		/>
																	</div>
																</div>
															) : (
																<>
																	<div className="w-2 h-2 border border-plum-purple/30 border-t-plum-purple rounded-full animate-spin" />
																	<span className="text-plum-purple">Uploading</span>
																</>
															)}
														</>
													)}
													{filePreview.status === "success" && (
														<>
															<Check size={10} className="text-green-500" />
															<span className="text-green-500">Done</span>
															{filePreview.transferSpeed && (
																<span className="text-xs text-gray-500 ml-auto">
																	{formatTransferSpeed(filePreview.transferSpeed)}
																</span>
															)}
														</>
													)}
													{filePreview.status === "error" && (
														<>
															<AlertCircle size={10} className="text-red-500" />
															<span className="text-red-500">Failed</span>
															<span
																className="text-xs text-red-500 truncate"
																title={filePreview.error}>
																{filePreview.error && filePreview.error.length > 15
																	? filePreview.error.substring(0, 15) + "..."
																	: filePreview.error}
															</span>
														</>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Preview sidebar */}
					{showPreview && selectedPreviewFile && (
						<div className="w-80 border-l bg-gray-50 p-4 flex flex-col">
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-semibold text-gray-800">Preview</h4>
								<button
									onClick={() => setShowPreview(false)}
									className="text-gray-400 hover:text-gray-600">
									<X size={16} />
								</button>
							</div>

							{selectedPreviewFile.preview && (
								<div className="mb-4">
									{/* Using Image from next/image would be better for production, but for simplicity 
                                    we'll keep using img with proper width/height attributes */}
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={selectedPreviewFile.preview}
										alt={selectedPreviewFile.file.name}
										className="w-full rounded-lg"
										width={400}
										height={300}
									/>
								</div>
							)}

							<div className="space-y-3 text-sm">
								<div>
									<label className="font-medium text-gray-700">Filename:</label>
									<p className="text-gray-600 break-words">
										{selectedPreviewFile.file.name}
									</p>
								</div>
								<div>
									<label className="font-medium text-gray-700">Size:</label>
									<p className="text-gray-600">
										{formatFileSize(selectedPreviewFile.file.size)}
									</p>
								</div>
								<div>
									<label className="font-medium text-gray-700">Type:</label>
									<p className="text-gray-600">{selectedPreviewFile.file.type}</p>
								</div>
								{selectedPreviewFile.dimensions && (
									<div>
										<label className="font-medium text-gray-700">Dimensions:</label>
										<p className="text-gray-600">
											{selectedPreviewFile.dimensions.width} ×{" "}
											{selectedPreviewFile.dimensions.height}
										</p>
									</div>
								)}
								<div>
									<label className="font-medium text-gray-700">Last Modified:</label>
									<p className="text-gray-600">
										{new Date(selectedPreviewFile.file.lastModified).toLocaleDateString()}
									</p>
								</div>
								<div>
									<label className="font-medium text-gray-700">Status:</label>
									<p
										className={`font-medium ${
											selectedPreviewFile.status === "success"
												? "text-green-600"
												: selectedPreviewFile.status === "error"
												? "text-red-600"
												: selectedPreviewFile.status === "uploading"
												? "text-blue-600"
												: "text-gray-600"
										}`}>
										{selectedPreviewFile.status.charAt(0).toUpperCase() +
											selectedPreviewFile.status.slice(1)}
										{selectedPreviewFile.progress !== undefined &&
											selectedPreviewFile.status === "uploading" &&
											` (${selectedPreviewFile.progress}%)`}
									</p>
									{selectedPreviewFile.status === "uploading" &&
										selectedPreviewFile.progress !== undefined && (
											<div className="w-full bg-gray-200 h-2 rounded-full mt-1">
												<div
													className="bg-blue-500 h-2 rounded-full transition-all duration-300"
													style={{ width: `${selectedPreviewFile.progress}%` }}
												/>
											</div>
										)}
									{selectedPreviewFile.error && (
										<p className="text-red-600 text-xs mt-1">
											{selectedPreviewFile.error}
										</p>
									)}
								</div>

								{selectedPreviewFile.transferSpeed && (
									<div>
										<label className="font-medium text-gray-700">Transfer Speed:</label>
										<p className="text-gray-600">
											{formatTransferSpeed(selectedPreviewFile.transferSpeed)}
										</p>
									</div>
								)}

								{selectedPreviewFile.uploadStartTime &&
									selectedPreviewFile.uploadEndTime && (
										<div>
											<label className="font-medium text-gray-700">Upload Duration:</label>
											<p className="text-gray-600">
												{(
													(selectedPreviewFile.uploadEndTime -
														selectedPreviewFile.uploadStartTime) /
													1000
												).toFixed(1)}{" "}
												seconds
											</p>
										</div>
									)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{files.length > 0 && (
					<div className="border-t bg-gray-50 p-6">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-600">
								{files.length} images selected • Day {selectedDay} • Original quality
								preserved
							</div>
							<div className="flex gap-3">
								{!isUploading ? (
									<>
										<button
											onClick={handleClose}
											className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
											Cancel
										</button>
										<button
											onClick={handleUpload}
											disabled={files.length === 0}
											className="bg-gradient-to-r from-plum-purple to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center gap-2">
											<Upload size={16} />
											Upload All ({files.length})
										</button>
									</>
								) : (
									<>
										<button
											onClick={togglePause}
											className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
											{isPaused ? <Play size={16} /> : <Pause size={16} />}
											{isPaused ? "Resume" : "Pause"}
										</button>
										<button
											onClick={cancelUpload}
											className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
											Cancel Upload
										</button>
									</>
								)}
							</div>
						</div>

						{isUploading && (
							<div className="mt-4">
								<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
									<span>Upload Progress</span>
									<span>
										{uploadStats.uploaded + uploadStats.failed}/{uploadStats.total}
									</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-plum-purple to-purple-600 h-2 rounded-full transition-all duration-300"
										style={{
											width: `${
												((uploadStats.uploaded + uploadStats.failed) / uploadStats.total) *
												100
											}%`,
										}}
									/>
								</div>
								<div className="flex items-center justify-between text-xs text-gray-500 mt-1">
									<span>✅ {uploadStats.uploaded} uploaded</span>
									{uploadStats.failed > 0 && <span>❌ {uploadStats.failed} failed</span>}
								</div>

								{/* Current file being uploaded */}
								{uploadStats.currentFile && (
									<div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
										<div className="w-2 h-2 bg-plum-purple rounded-full animate-pulse"></div>
										<span>
											Currently uploading:{" "}
											<span className="font-medium">{uploadStats.currentFile}</span>
										</span>
									</div>
								)}

								{/* Estimated time remaining */}
								{isUploading && uploadStats.uploaded > 0 && (
									<div className="mt-2 text-xs text-gray-600">
										<div className="flex items-center justify-between">
											<span>Estimated completion:</span>
											<span>
												{(() => {
													// Calculate estimated time based on progress so far
													const filesRemaining =
														uploadStats.total - uploadStats.uploaded - uploadStats.failed;
													const filesProcessed = uploadStats.uploaded + uploadStats.failed;

													if (filesProcessed === 0 || filesRemaining === 0)
														return "Calculating...";

													const averageFileTime = 10; // Approximate seconds per file based on past uploads
													const estimatedSecondsLeft = filesRemaining * averageFileTime;

													if (estimatedSecondsLeft < 60)
														return `About ${Math.ceil(estimatedSecondsLeft)} seconds`;
													if (estimatedSecondsLeft < 3600)
														return `About ${Math.ceil(estimatedSecondsLeft / 60)} minutes`;
													return `About ${(estimatedSecondsLeft / 3600).toFixed(1)} hours`;
												})()}
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Hidden inputs */}
				<input
					ref={folderInputRef}
					type="file"
					// @ts-expect-error WebKit directory attribute is not in standard HTML attributes
					webkitdirectory=""
					multiple
					accept="image/*"
					onChange={handleFolderSelect}
					className="hidden"
				/>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>
		</div>
	);
};

export default FolderUpload;
