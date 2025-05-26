"use client";

import React, { useState } from "react";
import {
	Upload,
	User,
	LogOut,
	Settings,
	Eye,
	EyeOff,
	Menu,
	X,
	BarChart3,
	Image as ImageIcon,
} from "lucide-react";

interface AdminPanelProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	onImageUpload: (file: File, day: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	onImageUpload,
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [credentials, setCredentials] = useState({ username: "", password: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [uploadDay, setUploadDay] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [uploadStatus, setUploadStatus] = useState<string>("");
	const [isSyncing, setIsSyncing] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Simple mock authentication - replace with real auth in production
		setTimeout(() => {
			if (
				credentials.username === "admin" &&
				credentials.password === "weenland2024"
			) {
				onLogin(true);
				setShowLoginForm(false);
				setCredentials({ username: "", password: "" });
			} else {
				alert("Invalid credentials. Try: admin / weenland2024");
			}
			setIsLoading(false);
		}, 1000);
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
				const result = await response.json();
				setUploadStatus("อัปโหลดสำเร็จ!");
				onImageUpload(file, uploadDay);

				// Reset form
				e.target.value = "";

				// Clear status after 3 seconds
				setTimeout(() => {
					setUploadProgress(null);
					setUploadStatus("");
				}, 3000);
			} else {
				const error = await response.json();
				setUploadStatus(`เกิดข้อผิดพลาด: ${error.error}`);
				setUploadProgress(null);
			}
		} catch (error) {
			console.error("Upload error:", error);
			setUploadStatus("เกิดข้อผิดพลาดในการอัปโหลด");
			setUploadProgress(null);
		}
	};

	const handleSyncImages = async () => {
		setIsSyncing(true);
		try {
			const response = await fetch("/api/sync");
			const result = await response.json();

			if (result.success) {
				alert(result.message);
				// Refresh the page to show updated images
				window.location.reload();
			} else {
				alert(`เกิดข้อผิดพลาด: ${result.error}`);
			}
		} catch (error) {
			console.error("Sync error:", error);
			alert("เกิดข้อผิดพลาดในการซิงค์รูปภาพ");
		} finally {
			setIsSyncing(false);
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
					Admin
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
						<p className="text-gray-600">Access the admin panel</p>
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

	// Admin panel when logged in
	return (
		<div className="fixed top-4 right-4 z-50">
			<div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 min-w-[300px]">
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
						onClick={onLogout}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						title="Logout">
						<LogOut size={18} />
					</button>
				</div>

				<div className="space-y-4">
					{/* Upload Section */}
					<div className="border border-gray-200 rounded-xl p-4">
						<h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
							<Upload size={16} />
							Upload Image
						</h3>

						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Day Assignment
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
									Select Image
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

					{/* Quick Actions */}
					<div className="border border-gray-200 rounded-xl p-4">
						<h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
							<Settings size={16} />
							Quick Actions
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
									<ImageIcon size={16} />
								)}
								{isSyncing ? "กำลังซิงค์..." : "ซิงค์รูปภาพจาก Google Cloud"}
							</button>
							<button
								className="w-full text-left px-3 py-2 text-sm text-gray-600 
							                 hover:bg-gray-50 rounded-lg transition-colors
							                 flex items-center gap-2">
								<BarChart3 size={16} />
								ดูสถิติการใช้งาน
							</button>
							<button
								className="w-full text-left px-3 py-2 text-sm text-gray-600 
							                 hover:bg-gray-50 rounded-lg transition-colors">
								จัดการหมวดหมู่
							</button>
							<button
								className="w-full text-left px-3 py-2 text-sm text-gray-600 
							                 hover:bg-gray-50 rounded-lg transition-colors">
								ส่งออกข้อมูล
							</button>
						</div>
					</div>

					{/* Upload Progress */}
					{uploadProgress !== null && (
						<div className="border border-gray-200 rounded-xl p-4">
							<h3 className="font-medium text-gray-800 mb-3">สถานะการอัปโหลด</h3>
							<div className="space-y-2">
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-plum-purple to-purple-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${uploadProgress}%` }}></div>
								</div>
								<p className="text-sm text-gray-600">{uploadStatus}</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminPanel;
