"use client";

import React, { useState, useEffect } from "react";
import {
	Upload,
	User,
	LogOut,
	Settings,
	Eye,
	EyeOff,
	Trash2,
	RefreshCw,
	Image as ImageIcon,
	AlertCircle,
	CheckCircle,
} from "lucide-react";

interface ImageData {
	id: number;
	title: string;
	fullUrl: string;
	thumbnailUrl: string;
	day?: number;
	gcsPath?: string;
}

interface EnhancedAdminPanelProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	onImageUpload?: (file: File, day: number) => void;
	images: ImageData[];
	onImagesUpdate: () => void;
}

const EnhancedAdminPanel: React.FC<EnhancedAdminPanelProps> = ({
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
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [uploadStatus, setUploadStatus] = useState<string>("");
	const [isSyncing, setIsSyncing] = useState(false);
	const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
	const [deleteStatus, setDeleteStatus] = useState<string>("");

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
			await fetch("/api/auth/logout", { method: "POST" });
			onLogout();
		} catch {
			onLogout(); // Logout locally even if server call fails
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadProgress(0);
		setUploadStatus("กำลังอัปโหลด...");

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("day", uploadDay.toString());

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev === null) return 10;
					if (prev < 90) return prev + 10;
					return prev;
				});
			}, 200);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (response.ok) {
				setUploadStatus("✅ อัปโหลดสำเร็จ!");

				// Reset form
				e.target.value = "";

				// Refresh images
				onImagesUpdate();

				// Clear status after 3 seconds
				setTimeout(() => {
					setUploadProgress(null);
					setUploadStatus("");
				}, 3000);
			} else {
				const error = await response.json();
				setUploadStatus(`❌ เกิดข้อผิดพลาด: ${error.error}`);
				setUploadProgress(null);
			}
		} catch {
			setUploadStatus("❌ เกิดข้อผิดพลาดในการอัปโหลด");
			setUploadProgress(null);
		}
	};

	const handleSyncImages = async () => {
		setIsSyncing(true);
		try {
			const response = await fetch("/api/sync", { method: "POST" });
			const result = await response.json();

			if (result.success) {
				alert(`✅ ${result.message}`);
				onImagesUpdate();
			} else {
				alert(`❌ เกิดข้อผิดพลาด: ${result.error}`);
			}
		} catch (error) {
			console.error("Sync error:", error);
			alert("❌ เกิดข้อผิดพลาดในการซิงค์รูปภาพ");
		} finally {
			setIsSyncing(false);
		}
	};

	const handleDeleteImage = async (imageId: number) => {
		if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?")) {
			return;
		}

		setDeleteStatus(`กำลังลบรูปภาพ ID: ${imageId}...`);

		try {
			const response = await fetch("/api/images/delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ imageId }),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				setDeleteStatus("✅ ลบรูปภาพสำเร็จ!");
				onImagesUpdate();
				setTimeout(() => setDeleteStatus(""), 3000);
			} else {
				setDeleteStatus(`❌ ${result.error}`);
				setTimeout(() => setDeleteStatus(""), 5000);
			}
		} catch (error) {
			console.error("Delete error:", error);
			setDeleteStatus("❌ เกิดข้อผิดพลาดในการลบรูปภาพ");
			setTimeout(() => setDeleteStatus(""), 5000);
		}
	};

	const handleDeleteSelected = async () => {
		if (selectedImages.size === 0) {
			alert("กรุณาเลือกรูปภาพที่ต้องการลบ");
			return;
		}

		if (
			!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพ ${selectedImages.size} รูป?`)
		) {
			return;
		}

		setDeleteStatus(`กำลังลบรูปภาพ ${selectedImages.size} รูป...`);

		const failedDeletes: number[] = [];

		for (const imageId of selectedImages) {
			try {
				const response = await fetch("/api/images/delete", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ imageId }),
				});

				if (!response.ok) {
					failedDeletes.push(imageId);
				}
			} catch {
				failedDeletes.push(imageId);
			}
		}

		if (failedDeletes.length === 0) {
			setDeleteStatus("✅ ลบรูปภาพทั้งหมดสำเร็จ!");
		} else {
			setDeleteStatus(
				`⚠️ ลบสำเร็จ ${selectedImages.size - failedDeletes.length} รูป, ล้มเหลว ${
					failedDeletes.length
				} รูป`
			);
		}

		setSelectedImages(new Set());
		onImagesUpdate();
		setTimeout(() => setDeleteStatus(""), 5000);
	};

	const toggleImageSelection = (imageId: number) => {
		setSelectedImages((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(imageId)) {
				newSet.delete(imageId);
			} else {
				newSet.add(imageId);
			}
			return newSet;
		});
	};

	const selectAllImages = () => {
		if (selectedImages.size === images.length) {
			setSelectedImages(new Set());
		} else {
			setSelectedImages(new Set(images.map((img) => img.id)));
		}
	};

	if (!isLoggedIn && !showLoginForm) {
		return (
			<div className="fixed top-4 right-4 z-50">
				<button
					onClick={() => setShowLoginForm(true)}
					className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl 
					         hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-lg">
					<User size={16} />
					Admin Login
				</button>
			</div>
		);
	}

	if (!isLoggedIn && showLoginForm) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
				<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
					<div className="text-center mb-6">
						<div
							className="w-16 h-16 bg-gradient-to-r from-plum-purple to-purple-600 rounded-full 
						            flex items-center justify-center mx-auto mb-4">
							<User size={24} className="text-white" />
						</div>
						<h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
						<p className="text-gray-600">เข้าสู่ระบบจัดการรูปภาพ</p>
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
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none 
								         focus:ring-2 focus:ring-plum-purple focus:border-transparent
								         transition-all duration-200"
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
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none 
									         focus:ring-2 focus:ring-plum-purple focus:border-transparent
									         transition-all duration-200 pr-12"
									placeholder="Enter password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
									         hover:text-gray-600 transition-colors">
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={() => setShowLoginForm(false)}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl 
								         hover:bg-gray-50 transition-all duration-200">
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex-1 bg-gradient-to-r from-plum-purple to-purple-600 text-white 
								         px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 
								         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
								         flex items-center justify-center gap-2">
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									"Login"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	}

	// Admin panel when logged in
	return (
		<div className="fixed top-4 right-4 z-50 max-w-md">
			<div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div
							className="w-8 h-8 bg-gradient-to-r from-plum-purple to-purple-600 rounded-full 
						            flex items-center justify-center">
							<User size={16} className="text-white" />
						</div>
						<span className="font-medium text-gray-800">Admin Panel</span>
					</div>
					<button
						onClick={handleLogout}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						title="Logout">
						<LogOut size={18} />
					</button>
				</div>

				<div className="space-y-4 max-h-96 overflow-y-auto">
					{/* Upload Section */}
					<div className="border border-gray-200 rounded-xl p-4">
						<h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
							<Upload size={16} />
							อัปโหลดรูปภาพ
						</h3>

						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									กำหนดวัน
								</label>
								<select
									value={uploadDay}
									onChange={(e) => setUploadDay(Number(e.target.value))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
									         focus:ring-2 focus:ring-plum-purple focus:border-transparent">
									{[1, 2, 3].map((day) => (
										<option key={day} value={day}>
											Day {day}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									เลือกรูปภาพ
								</label>
								<input
									type="file"
									accept="image/*"
									onChange={handleFileUpload}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg 
									         file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0
									         file:text-sm file:font-medium file:bg-plum-purple/10 
									         file:text-plum-purple hover:file:bg-plum-purple/20
									         cursor-pointer"
								/>
							</div>
						</div>
					</div>

					{/* Image Management */}
					<div className="border border-gray-200 rounded-xl p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="font-medium text-gray-800 flex items-center gap-2">
								<ImageIcon size={16} />
								จัดการรูปภาพ ({images.length} รูป)
							</h3>
							<button
								onClick={selectAllImages}
								className="text-xs text-plum-purple hover:text-purple-600">
								{selectedImages.size === images.length
									? "ยกเลิกทั้งหมด"
									: "เลือกทั้งหมด"}
							</button>
						</div>

						{selectedImages.size > 0 && (
							<div className="mb-3 p-2 bg-red-50 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm text-red-700">
										เลือกแล้ว {selectedImages.size} รูป
									</span>
									<button
										onClick={handleDeleteSelected}
										className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
										ลบที่เลือก
									</button>
								</div>
							</div>
						)}

						<div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
							{images.slice(0, 12).map((image) => (
								<div
									key={image.id}
									className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden
										${
											selectedImages.has(image.id)
												? "border-red-500"
												: "border-transparent hover:border-gray-300"
										}`}
									onClick={() => toggleImageSelection(image.id)}>
									<img
										src={image.thumbnailUrl}
										alt={image.title}
										className="w-full h-16 object-cover"
									/>
									<div
										className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
									              transition-opacity flex items-center justify-center">
										{selectedImages.has(image.id) ? (
											<CheckCircle size={16} className="text-red-400" />
										) : (
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteImage(image.id);
												}}
												className="text-red-400 hover:text-red-300">
												<Trash2 size={14} />
											</button>
										)}
									</div>
									<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5">
										ID: {image.id}
									</div>
								</div>
							))}
						</div>

						{images.length > 12 && (
							<p className="text-xs text-gray-500 mt-2 text-center">
								แสดง 12 รูปแรก จากทั้งหมด {images.length} รูป
							</p>
						)}
					</div>

					{/* Quick Actions */}
					<div className="border border-gray-200 rounded-xl p-4">
						<h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
							<Settings size={16} />
							การกระทำด่วน
						</h3>

						<div className="space-y-2">
							<button
								onClick={handleSyncImages}
								disabled={isSyncing}
								className="w-full text-left px-3 py-2 text-sm text-gray-600 
							                 hover:bg-gray-50 rounded-lg transition-colors
							                 disabled:opacity-50 disabled:cursor-not-allowed
							                 flex items-center gap-2">
								{isSyncing ? (
									<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
								) : (
									<RefreshCw size={16} />
								)}
								{isSyncing ? "กำลังซิงค์..." : "ซิงค์รูปภาพจาก Google Cloud"}
							</button>
						</div>
					</div>

					{/* Status Messages */}
					{(uploadProgress !== null || deleteStatus) && (
						<div className="border border-gray-200 rounded-xl p-4">
							<h3 className="font-medium text-gray-800 mb-3">สถานะ</h3>

							{uploadProgress !== null && (
								<div className="space-y-2 mb-3">
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-gradient-to-r from-plum-purple to-purple-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${uploadProgress}%` }}></div>
									</div>
									<p className="text-sm text-gray-600">{uploadStatus}</p>
								</div>
							)}

							{deleteStatus && (
								<div className="flex items-center gap-2 text-sm">
									{deleteStatus.includes("✅") ? (
										<CheckCircle size={16} className="text-green-500" />
									) : (
										<AlertCircle size={16} className="text-red-500" />
									)}
									<span>{deleteStatus}</span>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EnhancedAdminPanel;
