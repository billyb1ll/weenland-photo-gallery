// Simplified and optimized admin navigation bar component
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	Upload,
	User,
	LogOut,
	RefreshCw,
	BarChart3,
	HardDrive,
	Settings,
} from "lucide-react";
import AdminLoginModal from "./AdminLoginModal";
import AdminStatsPanel from "./AdminStatsPanel";
import DropZoneUpload from "./DropZoneUpload";
import FolderUpload from "./FolderUpload";

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
	isHighlight?: boolean;
}

interface OptimizationInfo {
	totalImages: number;
	cachedImages: number;
	memoryUsage?: number;
	loadTime?: number;
	imageLoadAvg?: number;
	unloadedImages?: number;
	renderTime?: number;
}

interface OptimizedAdminNavBarProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	images: ImageData[];
	onImagesUpdate: () => void;
	selectedDay: number | null;
	optimizationInfo?: OptimizationInfo;
}

const OptimizedAdminNavBar: React.FC<OptimizedAdminNavBarProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	images,
	onImagesUpdate,
	selectedDay,
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [showDropZone, setShowDropZone] = useState(false);
	const [showBulkUpload, setShowBulkUpload] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [showStats, setShowStats] = useState(false);

	// Check authentication status on mount
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

	// Login handler for AdminLoginModal
	const handleLoginSubmit = useCallback(
		async (username: string, password: string) => {
			try {
				const response = await fetch("/api/auth/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username, password }),
				});
				const result = await response.json();

				if (result.success) {
					onLogin(true);
				} else {
					throw new Error("Invalid credentials");
				}
			} catch (error) {
				throw error;
			}
		},
		[onLogin]
	);

	// Memoized stats calculation
	const stats = React.useMemo(() => {
		const byDay = images.reduce((acc, img) => {
			const day = img.day || 1;
			acc[day] = (acc[day] || 0) + 1;
			return acc;
		}, {} as Record<number, number>);

		const recentUploads = images.filter((img) => {
			const uploadDate = new Date(img.uploadDate || 0);
			const today = new Date();
			const diffTime = Math.abs(today.getTime() - uploadDate.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays <= 7;
		}).length;

		return {
			total: images.length,
			byDay,
			recentUploads,
		};
	}, [images]);

	// Force sync handler - updates all pictures from bucket
	const handleSync = useCallback(async () => {
		setIsSyncing(true);
		try {
			// Force sync all images from bucket (replaces local data with bucket data)
			const syncResponse = await fetch(
				"/api/sync?useFilenames=true&forceUpdate=true",
				{
					method: "POST",
				}
			);
			const syncResult = await syncResponse.json();

			if (syncResult.success) {
				console.log(`✅ Force sync completed: ${syncResult.message}`);
				console.log(
					`📊 Updated ${syncResult.totalImages} images (${syncResult.newImages} new)`
				);

				// Refresh the local image data
				onImagesUpdate();

				// Show success notification
				console.log(`✅ All images force-synchronized from bucket successfully`);
			} else {
				console.error(`❌ Force sync error: ${syncResult.error}`);
			}
		} catch (error) {
			console.error("❌ Failed to force sync images from bucket:", error);
		} finally {
			setIsSyncing(false);
		}
	}, [onImagesUpdate]);

	// Optimized bulk upload handler
	const handleBulkUpload = useCallback(
		async (files: File[], day: number) => {
			const formData = new FormData();

			files.forEach((file, index) => {
				formData.append(`files[${index}]`, file);
			});
			formData.append("day", day.toString());
			formData.append("useFilenames", "true");

			try {
				const response = await fetch("/api/upload/bulk", {
					method: "POST",
					body: formData,
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Bulk upload failed");
				}

				if (result.success) {
					const { uploaded, failed } = result.results;
					console.log(
						`✅ Bulk upload completed! Uploaded: ${uploaded.length}, Failed: ${failed.length}`
					); // Sync images after bulk upload using force update to refresh from bucket
					try {
						await fetch("/api/sync?useFilenames=true&forceUpdate=true", {
							method: "POST",
						});
						console.log("✅ Auto-synced images after bulk upload");
					} catch (syncError) {
						console.error("Failed to auto-sync images after bulk upload:", syncError);
					}
				}

				onImagesUpdate();
				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				console.error(`❌ Bulk upload failed: ${errorMessage}`);
				throw error;
			}
		},
		[onImagesUpdate]
	);

	// Login button for non-authenticated users
	if (!isLoggedIn) {
		return (
			<>
				<div className="fixed top-4 right-4 z-50">
					<button
						onClick={() => setShowLoginForm(true)}
						className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-lg">
						<User size={16} />
						Admin Login
					</button>
				</div>

				<AdminLoginModal
					isOpen={showLoginForm}
					onClose={() => setShowLoginForm(false)}
					onLogin={handleLoginSubmit}
				/>
			</>
		);
	}

	// Admin navigation bar for authenticated users
	return (
		<>
			{/* Main Admin Bar */}
			<div className="bg-gradient-to-r from-plum-purple to-purple-600 text-white shadow-lg sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Left side - Admin info */}
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

							{/* Stats toggle */}
							<button
								onClick={() => setShowStats(!showStats)}
								className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
								<BarChart3 size={16} />
								<span className="hidden md:inline">Stats</span>
							</button>
						</div>

						{/* Right side - Action buttons */}
						<div className="flex items-center gap-2">
							<button
								onClick={() => setShowDropZone(true)}
								className="bg-green-500/90 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg">
								<Upload size={16} />
								<span className="hidden sm:inline">Upload</span>
							</button>

							<button
								onClick={() => setShowBulkUpload(true)}
								className="bg-purple-500/90 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg">
								<HardDrive size={16} />
								<span className="hidden sm:inline">Bulk</span>
							</button>

							<button
								onClick={handleSync}
								disabled={isSyncing}
								className="bg-blue-500/90 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg disabled:opacity-50"
								title="Force sync all images from Google Cloud Storage bucket">
								<RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
								<span className="hidden sm:inline">
									{isSyncing ? "Force Syncing..." : "Force Sync"}
								</span>
							</button>

							<button
								onClick={onLogout}
								className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
								title="Logout">
								<LogOut size={16} />
							</button>
						</div>
					</div>

					{/* Stats Panel */}
					{showStats && (
						<AdminStatsPanel
							totalImages={stats.total}
							highlightedImages={images.filter((img) => img.isHighlight).length}
							totalDays={Object.keys(stats.byDay).length}
							storageUsed="Calculating..."
							lastUpdate={new Date()}
							isAuthenticated={isLoggedIn}
						/>
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

			{/* Upload Modals */}
			<DropZoneUpload
				isOpen={showDropZone}
				onClose={() => setShowDropZone(false)}
				onUpload={handleBulkUpload}
				currentDay={selectedDay || 1}
			/>

			<FolderUpload
				isOpen={showBulkUpload}
				onClose={() => setShowBulkUpload(false)}
				onUploadComplete={onImagesUpdate}
				currentDay={selectedDay || 1}
			/>
		</>
	);
};

export default OptimizedAdminNavBar;
