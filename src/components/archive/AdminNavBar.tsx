"use client";

import React, { useState, useEffect } from "react";
import {
	Upload,
	User,
	LogOut,
	RefreshCw,
	Eye,
	EyeOff,
	Edit3,
	Check,
	X,
	Trash2,
} from "lucide-react";

interface ImageData {
	id: number;
	title: string;
	fullUrl: string;
	thumbnailUrl: string;
	day?: number;
	gcsPath?: string;
}

interface AdminNavBarProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	images: ImageData[];
	onImagesUpdate: () => void;
}

const AdminNavBar: React.FC<AdminNavBarProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	images,
	onImagesUpdate,
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [credentials, setCredentials] = useState({ username: "", password: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [uploadDay, setUploadDay] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [uploadStatus, setUploadStatus] = useState<string>("");
	const [isSyncing, setIsSyncing] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [showAdminPanel, setShowAdminPanel] = useState(false);
	const [editingImageId, setEditingImageId] = useState<number | null>(null);
	const [editingDay, setEditingDay] = useState<number>(1);
	const [deletingImages, setDeletingImages] = useState<Set<number>>(new Set());

	// Check authentication status on component mount
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await fetch("/api/auth/verify");
				const result = await response.json();
				if (result.authenticated) {
					onLogin(true);
				}
			} catch {
				// Ignore auth check errors
			}
		};

		checkAuthStatus();
	}, [onLogin]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(credentials),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				onLogin(true);
				setShowLoginForm(false);
				setCredentials({ username: "", password: "" });
			} else {
				alert(result.error || "Login failed");
			}
		} catch {
			alert("Login failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
			});
			onLogout();
		} catch {
			onLogout(); // Logout locally even if server call fails
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setUploadProgress(0);
		setUploadStatus("กำลังอัปโหลด...");

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("day", uploadDay.toString());

			const xhr = new XMLHttpRequest();

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percentComplete = (event.loaded / event.total) * 100;
					setUploadProgress(percentComplete);
				}
			};

			xhr.onload = () => {
				if (xhr.status === 200) {
					setUploadStatus("✅ อัปโหลดสำเร็จ!");
					setShowUploadModal(false);
					setSelectedFile(null);
					onImagesUpdate();
					setTimeout(() => {
						setUploadProgress(null);
						setUploadStatus("");
					}, 3000);
				} else {
					setUploadStatus("❌ อัปโหลดล้มเหลว");
					setTimeout(() => {
						setUploadProgress(null);
						setUploadStatus("");
					}, 3000);
				}
			};

			xhr.onerror = () => {
				setUploadStatus("❌ อัปโหลดล้มเหลว");
				setTimeout(() => {
					setUploadProgress(null);
					setUploadStatus("");
				}, 3000);
			};

			xhr.open("POST", "/api/upload");
			xhr.send(formData);
		} catch {
			setUploadStatus("❌ อัปโหลดล้มเหลว");
			setTimeout(() => {
				setUploadProgress(null);
				setUploadStatus("");
			}, 3000);
		}
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			const response = await fetch("/api/sync", {
				method: "POST",
			});

			if (response.ok) {
				onImagesUpdate();
			} else {
				alert("Sync failed");
			}
		} catch {
			alert("Sync failed");
		} finally {
			setIsSyncing(false);
		}
	};

	const handleUpdateImageDay = async (imageId: number, newDay: number) => {
		try {
			const response = await fetch("/api/images/update", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ imageId, day: newDay }),
			});

			if (response.ok) {
				onImagesUpdate();
				setEditingImageId(null);
			} else {
				alert("Failed to update image day");
			}
		} catch {
			alert("Failed to update image day");
		}
	};

	const handleDeleteImage = async (imageId: number) => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		setDeletingImages((prev) => new Set([...prev, imageId]));
		try {
			const response = await fetch(`/api/images/delete`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ imageId }),
			});

			if (response.ok) {
				onImagesUpdate();
			} else {
				alert("Failed to delete image");
			}
		} catch {
			alert("Failed to delete image");
		} finally {
			setDeletingImages((prev) => {
				const newSet = new Set(prev);
				newSet.delete(imageId);
				return newSet;
			});
		}
	};

	// Login Modal
	if (!isLoggedIn && showLoginForm) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
				<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
					<div className="text-center mb-6">
						<div className="w-16 h-16 bg-gradient-to-r from-plum-purple to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<User size={24} className="text-white" />
						</div>
						<h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
						<p className="text-gray-600">Picture Management</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Username
							</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) =>
									setCredentials({ ...credentials, username: e.target.value })
								}
								className="w-full px-4 text-black py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent transition-all duration-200"
								placeholder="Enter username"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={credentials.password}
									onChange={(e) =>
										setCredentials({ ...credentials, password: e.target.value })
									}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent transition-all duration-200 pr-12"
									placeholder="Enter password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={() => setShowLoginForm(false)}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200">
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex-1 bg-gradient-to-r from-plum-purple to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									"Login"
								)}
							</button>
						</div>
					</form>

					<div className="mt-6 p-4 bg-gray-50 rounded-xl">
						<p className="text-xs text-gray-600 text-center">
							Demo credentials: <br />
							<span className="font-mono">admin / weenland2024</span>
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Upload Modal
	if (showUploadModal) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
				<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
					<div className="text-center mb-6">
						<div className="w-16 h-16 bg-gradient-to-r from-plum-purple to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Upload size={24} className="text-white" />
						</div>
						<h2 className="text-2xl font-bold text-gray-800">Upload Image</h2>
						<p className="text-gray-600">เพิ่มรูปภาพใหม่เข้าสู่แกลเลอรี่</p>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								วันที่
							</label>
							<select
								value={uploadDay}
								onChange={(e) => setUploadDay(Number(e.target.value))}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent">
								{Array.from({ length: 3 }, (_, i) => i + 1).map((day) => (
									<option key={day} value={day}>
										Day {day}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								เลือกรูปภาพ
							</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-plum-purple/10 file:text-plum-purple hover:file:bg-plum-purple/20 cursor-pointer"
							/>
							{selectedFile && (
								<p className="mt-2 text-sm text-gray-600">
									เลือกไฟล์: {selectedFile.name}
								</p>
							)}
						</div>

						{uploadProgress !== null && (
							<div>
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm font-medium text-gray-700">Progress</span>
									<span className="text-sm text-gray-500">
										{Math.round(uploadProgress)}%
									</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-plum-purple to-purple-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${uploadProgress}%` }}></div>
								</div>
								<p className="text-sm text-gray-600 mt-1">{uploadStatus}</p>
							</div>
						)}

						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={() => {
									setShowUploadModal(false);
									setSelectedFile(null);
									setUploadProgress(null);
									setUploadStatus("");
								}}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200">
								Cancel
							</button>
							<button
								onClick={handleUpload}
								disabled={!selectedFile || uploadProgress !== null}
								className="flex-1 bg-gradient-to-r from-plum-purple to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
								<Upload size={16} />
								Submit
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!isLoggedIn) {
		return (
			<div className="fixed top-4 right-4 z-50">
				<button
					onClick={() => setShowLoginForm(true)}
					className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-lg">
					<User size={16} />
					Admin Login
				</button>
			</div>
		);
	}

	// Admin Navigation Bar when logged in
	return (
		<>
			{/* Admin Top Bar */}
			<div className="bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-14">
						{/* Left side - Admin indicator */}
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
								<User size={16} className="text-white" />
							</div>
							<span className="font-medium">Admin Mode</span>
							<span className="text-white/80 text-sm">({images.length} images)</span>
						</div>

						{/* Right side - Actions */}
						<div className="flex items-center gap-2">
							<button
								onClick={() => setShowUploadModal(true)}
								className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
								<Upload size={16} />
								<span className="hidden sm:inline">Upload</span>
							</button>

							<button
								onClick={() => setShowAdminPanel(!showAdminPanel)}
								className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
								<Edit3 size={16} />
								<span className="hidden sm:inline">Manage</span>
							</button>

							<button
								onClick={handleSync}
								disabled={isSyncing}
								className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50">
								<RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
								<span className="hidden sm:inline">
									{isSyncing ? "Syncing..." : "Sync"}
								</span>
							</button>

							<button
								onClick={handleLogout}
								className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
								title="Logout">
								<LogOut size={16} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Admin Panel */}
			{showAdminPanel && (
				<div className="bg-white border-b shadow-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Image Management
						</h3>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
							{images.map((image) => (
								<div
									key={image.id}
									className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
									<div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={image.thumbnailUrl}
											alt={image.title}
											className="w-full h-full object-cover"
										/>
									</div>

									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-800 truncate">
											{image.title}
										</p>

										{editingImageId === image.id ? (
											<div className="flex items-center gap-2 mt-1">
												<select
													value={editingDay}
													onChange={(e) => setEditingDay(Number(e.target.value))}
													className="text-xs px-2 py-1 border border-gray-300 rounded">
													{Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
														<option key={day} value={day}>
															Day {day}
														</option>
													))}
												</select>
												<button
													onClick={() => handleUpdateImageDay(image.id, editingDay)}
													className="text-green-600 hover:text-green-700">
													<Check size={14} />
												</button>
												<button
													onClick={() => setEditingImageId(null)}
													className="text-gray-400 hover:text-gray-600">
													<X size={14} />
												</button>
											</div>
										) : (
											<div className="flex items-center justify-between mt-1">
												<span className="text-xs text-gray-500">Day {image.day || 1}</span>
												<div className="flex gap-1">
													<button
														onClick={() => {
															setEditingImageId(image.id);
															setEditingDay(image.day || 1);
														}}
														className="text-blue-600 hover:text-blue-700">
														<Edit3 size={12} />
													</button>
													<button
														onClick={() => handleDeleteImage(image.id)}
														disabled={deletingImages.has(image.id)}
														className="text-red-600 hover:text-red-700 disabled:opacity-50">
														{deletingImages.has(image.id) ? (
															<div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
														) : (
															<Trash2 size={12} />
														)}
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>

						{images.length === 0 && (
							<p className="text-gray-500 text-center py-8">
								No images found. Upload some images to get started.
							</p>
						)}
					</div>
				</div>
			)}

			{/* Status Messages */}
			{uploadStatus && (
				<div className="fixed top-16 right-4 z-50 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
					<p className="text-sm">{uploadStatus}</p>
				</div>
			)}
		</>
	);
};

export default AdminNavBar;
