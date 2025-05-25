"use client";

import React, { useState, useEffect } from "react";
import {
	Upload,
	User,
	LogOut,
	RefreshCw,
	Eye,
	EyeOff,
	Settings,
	BarChart3,
} from "lucide-react";
import DropZoneUpload from "./DropZoneUpload";

interface ImageData {
	id: number;
	title: string;
	fullUrl: string;
	thumbnailUrl: string;
	day?: number;
	gcsPath?: string;
	category?: string;
	tags?: string[];
	uploadDate?: string;
}

interface EnhancedAdminNavBarProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	images: ImageData[];
	onImagesUpdate: () => void;
	selectedDay: number | null;
}

const EnhancedAdminNavBar: React.FC<EnhancedAdminNavBarProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	images,
	onImagesUpdate,
	selectedDay,
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [credentials, setCredentials] = useState({ username: "", password: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showDropZone, setShowDropZone] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [showStats, setShowStats] = useState(false);

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
			// Always logout locally even if server request fails
			onLogout();
		}
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			const response = await fetch("/api/sync", { method: "POST" });
			const result = await response.json();

			if (result.success) {
				onImagesUpdate();
				alert(`✅ ${result.message}`);
			} else {
				alert(`❌ ${result.error}`);
			}
		} catch {
			alert("❌ Failed to sync images");
		} finally {
			setIsSyncing(false);
		}
	};

	const handleBulkUpload = async (files: File[], day: number) => {
		const uploadPromises = files.map(async (file) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("day", day.toString());
			formData.append("title", file.name.split(".")[0]);
			formData.append("category", "uploaded");
			formData.append("tags", `day-${day},uploaded`);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || `Failed to upload ${file.name}`);
			}

			return response.json();
		});

		try {
			await Promise.all(uploadPromises);
			onImagesUpdate();
		} catch (error) {
			throw error;
		}
	};

	// Calculate stats
	const stats = {
		total: images.length,
		byDay: images.reduce((acc, img) => {
			const day = img.day || 1;
			acc[day] = (acc[day] || 0) + 1;
			return acc;
		}, {} as Record<number, number>),
		recentUploads: images.filter((img) => {
			const uploadDate = new Date(img.uploadDate || 0);
			const today = new Date();
			const diffTime = Math.abs(today.getTime() - uploadDate.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays <= 7;
		}).length,
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
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent transition-all duration-200"
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
					<div className="flex justify-between items-center h-16">
						{/* Left side - Admin indicator */}
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
									<User size={18} className="text-white" />
								</div>
								<div>
									<span className="font-semibold text-lg">Admin Panel</span>
									<div className="text-white/80 text-sm flex items-center gap-3">
										<span>{stats.total} images</span>
										<span>•</span>
										<span>{stats.recentUploads} recent</span>
									</div>
								</div>
							</div>

							{/* Quick Stats */}
							<button
								onClick={() => setShowStats(!showStats)}
								className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
								<BarChart3 size={16} />
								<span className="hidden md:inline">Stats</span>
							</button>
						</div>

						{/* Right side - Actions */}
						<div className="flex items-center gap-2">
							<button
								onClick={() => setShowDropZone(true)}
								className="bg-green-500/90 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg">
								<Upload size={16} />
								<span className="hidden sm:inline">Upload Images</span>
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

					{/* Stats Panel */}
					{showStats && (
						<div className="border-t border-white/20 py-4">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="bg-white/10 rounded-lg p-3">
									<div className="text-2xl font-bold">{stats.total}</div>
									<div className="text-white/80 text-sm">Total Images</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3">
									<div className="text-2xl font-bold">
										{Object.keys(stats.byDay).length}
									</div>
									<div className="text-white/80 text-sm">Active Days</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3">
									<div className="text-2xl font-bold">{stats.recentUploads}</div>
									<div className="text-white/80 text-sm">Recent Uploads</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3">
									<div className="text-2xl font-bold">
										{Math.max(...Object.values(stats.byDay), 0)}
									</div>
									<div className="text-white/80 text-sm">Max per Day</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Admin Notice Bar */}
			<div className="bg-blue-50 border-b border-blue-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2 text-blue-700">
							<Settings size={14} />
							<span>
								Admin mode active - Click on images to edit directly in the gallery
							</span>
						</div>
						<div className="text-blue-600">
							{selectedDay ? `Viewing Day ${selectedDay}` : "All Days"}
						</div>
					</div>
				</div>
			</div>

			{/* Drop Zone Upload Modal */}
			<DropZoneUpload
				isOpen={showDropZone}
				onClose={() => setShowDropZone(false)}
				onUpload={handleBulkUpload}
				currentDay={selectedDay || 1}
			/>
		</>
	);
};

export default EnhancedAdminNavBar;
