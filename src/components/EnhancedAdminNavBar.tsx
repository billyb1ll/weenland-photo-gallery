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
	Zap,
	HardDrive,
	Activity,
	Clock,
	Gauge,
	Trash2,
} from "lucide-react";
import DropZoneUpload from "./DropZoneUpload";
import BulkUploadDropZone from "./BulkUploadDropZone";
import PerformanceGraph from "./PerformanceGraph";

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
	optimizationInfo?: {
		totalImages: number;
		cachedImages: number;
		memoryUsage?: number;
		loadTime?: number;
		imageLoadAvg?: number;
		unloadedImages?: number;
		renderTime?: number;
	};
}

const EnhancedAdminNavBar: React.FC<EnhancedAdminNavBarProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	images,
	onImagesUpdate,
	selectedDay,
	optimizationInfo = {
		totalImages: 0,
		cachedImages: 0,
	},
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [credentials, setCredentials] = useState({ username: "", password: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showDropZone, setShowDropZone] = useState(false);
	const [showBulkUpload, setShowBulkUpload] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [optimizationMode, setOptimizationMode] = useState<
		"normal" | "aggressive"
	>("normal");

	// Register global optimization functions for large collections
	useEffect(() => {
		if (typeof window !== "undefined" && images.length > 5000) {
			// Initialize the weenland global object if it doesn't exist
			window.weenland = window.weenland || {};

			// Register cleanup function
			window.weenland.forceMemoryCleanup = () => {
				if (typeof window.gc === "function") {
					window.gc();
					alert("Memory cleanup triggered");
				} else if (
					typeof (window as unknown as { CollectGarbage?: () => void })
						.CollectGarbage === "function"
				) {
					(window as unknown as { CollectGarbage: () => void }).CollectGarbage();
					alert("Memory cleanup triggered");
				} else {
					console.log("Attempting alternative memory cleanup");
					// Alternative cleanup approach for browsers without explicit GC
					const memoryHog: Array<Array<string>> = [];
					try {
						// Force memory pressure to trigger GC indirectly
						for (let i = 0; i < 10000; i++) {
							memoryHog.push(new Array(10000).fill("x"));
						}
					} catch {
						// Ignore errors and continue
						console.log("Created memory pressure for GC");
					}
					// Clear the array
					memoryHog.length = 0;

					alert("Alternative memory cleanup triggered");
				}
			};

			// Register optimization mode toggle
			window.weenland.toggleAggressiveOptimization = () => {
				setOptimizationMode((current) => {
					const newMode = current === "normal" ? "aggressive" : "normal";
					alert(`Optimization mode set to: ${newMode}`);
					return newMode;
				});
			};
		}

		return () => {
			// Cleanup global functions when component unmounts
			if (typeof window !== "undefined" && window.weenland) {
				delete window.weenland.forceMemoryCleanup;
				delete window.weenland.toggleAggressiveOptimization;
			}
		};
	}, [images.length]);

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
						<p className="text-gray-600">Picture Management System</p>
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
								className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent transition-all duration-200"
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
									className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-purple focus:border-transparent transition-all duration-200 pr-12"
									placeholder="Enter password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 inset-y-0 my-auto h-fit flex items-center text-gray-400 hover:text-gray-600 transition-colors">
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
										{stats.total > 1000 && (
											<span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full font-medium">
												{stats.total > 5000 ? "High Volume" : "Large Collection"}
											</span>
										)}
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
								onClick={() => setShowBulkUpload(true)}
								className="bg-purple-500/90 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg">
								<HardDrive size={16} />
								<span className="hidden sm:inline">Bulk Upload</span>
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

							{stats.total > 500 && (
								<div className="mt-4 bg-white/10 rounded-lg p-3 text-sm">
									<div className="font-medium mb-1">Large Collection Optimizations</div>
									<ul className="list-disc pl-5 text-white/80 space-y-1">
										<li>Virtualized rendering for better performance</li>
										<li>Pagination with 100 images per batch</li>
										<li>API caching to reduce server load</li>
										<li>Optimized image loading with abort controller</li>
										{stats.total > 1000 && (
											<>
												<li>Memory management with automatic cleanup</li>
												<li>Preloading of adjacent day images</li>
											</>
										)}
									</ul>

									{stats.total > 2000 && (
										<>
											<div className="mt-3 grid grid-cols-2 gap-2">
												<div className="bg-white/10 rounded p-2">
													<div className="text-xs text-white/70">Cached Images</div>
													<div className="font-medium flex items-center gap-1">
														<HardDrive size={14} />
														{optimizationInfo.cachedImages}
													</div>
												</div>
												<div className="bg-white/10 rounded p-2">
													<div className="text-xs text-white/70">Memory Usage</div>
													<div className="font-medium flex items-center gap-1">
														<Zap size={14} />
														{optimizationInfo.memoryUsage
															? `${Math.round(optimizationInfo.memoryUsage)}%`
															: "N/A"}
													</div>
												</div>
												{optimizationInfo.loadTime && (
													<div className="bg-white/10 rounded p-2">
														<div className="text-xs text-white/70">Load Time</div>
														<div className="font-medium flex items-center gap-1">
															<Clock size={14} />
															{optimizationInfo.loadTime}ms
														</div>
													</div>
												)}
												{optimizationInfo.renderTime && (
													<div className="bg-white/10 rounded p-2">
														<div className="text-xs text-white/70">Render Time</div>
														<div className="font-medium flex items-center gap-1">
															<Activity size={14} />
															{optimizationInfo.renderTime}ms
														</div>
													</div>
												)}
											</div>

											{/* Add the performance graph for visual metrics */}
											{optimizationInfo.memoryUsage && (
												<div className="mt-3">
													<PerformanceGraph
														memoryUsage={optimizationInfo.memoryUsage}
														imageLoadTime={optimizationInfo.imageLoadAvg}
														renderTime={optimizationInfo.renderTime}
													/>
												</div>
											)}
										</>
									)}

									{/* Optimization Controls for ultra-large collections */}
									{stats.total > 5000 && (
										<div className="mt-4 bg-white/10 rounded-lg p-3">
											<div className="font-medium mb-2 flex items-center justify-between">
												<span>Ultra-large Collection Controls</span>
												<span className="text-xs bg-yellow-500 text-purple-900 px-2 py-0.5 rounded-full font-medium">
													{stats.total > 10000 ? "Extreme" : "Ultra-large"}
												</span>
											</div>

											<div className="grid grid-cols-2 gap-2 mt-2">
												<button
													onClick={() => {
														// Trigger memory cleanup via the window object if implemented
														if (
															typeof window !== "undefined" &&
															window.weenland?.forceMemoryCleanup
														) {
															window.weenland.forceMemoryCleanup();
														} else {
															alert("Memory cleanup function not available");
														}
													}}
													className="bg-white/20 hover:bg-white/30 p-2 rounded text-xs flex items-center justify-center gap-1">
													<Trash2 size={12} />
													Force Memory Cleanup
												</button>
												<button
													onClick={() => {
														// Toggle aggressive optimization mode
														if (
															typeof window !== "undefined" &&
															window.weenland?.toggleAggressiveOptimization
														) {
															window.weenland.toggleAggressiveOptimization();
														} else {
															alert("Optimization toggle not available");
														}
													}}
													className={`p-2 rounded text-xs flex items-center justify-center gap-1 ${
														optimizationMode === "aggressive"
															? "bg-yellow-500/70 hover:bg-yellow-500/90 text-purple-900"
															: "bg-white/20 hover:bg-white/30"
													}`}>
													<Gauge size={12} />
													{optimizationMode === "aggressive"
														? "Aggressive Mode ON"
														: "Toggle Aggressive Mode"}
												</button>
											</div>

											{optimizationInfo.unloadedImages !== undefined && (
												<div className="mt-2 text-xs text-white/80 flex items-center justify-between">
													<span>Unloaded images: {optimizationInfo.unloadedImages}</span>
													{optimizationInfo.imageLoadAvg !== undefined && (
														<span>
															Avg. load time: {optimizationInfo.imageLoadAvg.toFixed(1)}ms
														</span>
													)}
												</div>
											)}
										</div>
									)}
								</div>
							)}
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

			{/* Bulk Upload Modal */}
			<BulkUploadDropZone
				isOpen={showBulkUpload}
				onClose={() => setShowBulkUpload(false)}
				currentDay={selectedDay || 1}
			/>
		</>
	);
};

export default EnhancedAdminNavBar;
