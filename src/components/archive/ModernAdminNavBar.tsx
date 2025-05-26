"use client";

import React, { useState } from "react";
import { Upload, User, LogOut, Menu, X, RefreshCw } from "lucide-react";
import UploadForm from "./UploadForm";

interface AdminNavBarProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	onImageUpload: (file: File, day: number) => void;
	onSyncComplete?: () => void;
}

const AdminNavBar: React.FC<AdminNavBarProps> = ({
	isLoggedIn,
	onLogin,
	onLogout,
	onImageUpload,
	onSyncComplete,
}) => {
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [credentials, setCredentials] = useState({ username: "", password: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [showUploadForm, setShowUploadForm] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncMessage, setSyncMessage] = useState("");

	const handleUploadSuccess = () => {
		console.log("Upload successful!");
		setShowUploadForm(false);
		// Auto-sync after successful upload
		handleSync();
	};

	const handleSync = async () => {
		setIsSyncing(true);
		setSyncMessage("");

		try {
			const response = await fetch("/api/sync", {
				method: "POST",
			});

			const result = await response.json();

			if (result.success) {
				setSyncMessage(
					`✅ ซิงค์สำเร็จ! พบรูปภาพ ${result.totalImages} รูป (GCS: ${result.gcsImageCount}, Demo: ${result.demoImageCount})`
				);

				// Call onSyncComplete if provided
				if (onSyncComplete) {
					onSyncComplete();
				}

				// Clear message after 3 seconds
				setTimeout(() => {
					setSyncMessage("");
				}, 3000);
			} else {
				setSyncMessage(`❌ ${result.error}`);
			}
		} catch (error) {
			console.error("Sync error:", error);
			setSyncMessage("❌ เกิดข้อผิดพลาดในการซิงค์รูปภาพ");
		} finally {
			setIsSyncing(false);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

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
		}, 1500);
	};

	// Show upload form modal
	if (showUploadForm) {
		return (
			<UploadForm
				onUploadSuccess={handleUploadSuccess}
				onClose={() => setShowUploadForm(false)}
				selectedDay={1}
			/>
		);
	}

	// Show login form
	if (showLoginForm) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
				<div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-purple-600 mb-2">Admin Access</h2>
						<p className="text-gray-600">Sign in to manage your photo gallery</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								Username
							</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) =>
									setCredentials({ ...credentials, username: e.target.value })
								}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-600"
								placeholder="Enter username"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								Password
							</label>
							<input
								type="password"
								value={credentials.password}
								onChange={(e) =>
									setCredentials({ ...credentials, password: e.target.value })
								}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-600"
								placeholder="Enter password"
								required
							/>
						</div>

						<div className="flex gap-4 pt-6">
							<button
								type="button"
								onClick={() => setShowLoginForm(false)}
								className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50">
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex-1 bg-purple-600 text-white px-6 py-4 rounded-2xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center">
								{isLoading ? (
									<div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									"Sign In"
								)}
							</button>
						</div>
					</form>

					<div className="mt-8 p-4 bg-gray-50 rounded-2xl">
						<p className="text-sm text-gray-600 text-center">
							<span className="font-semibold">Demo Credentials:</span> <br />
							<span className="font-mono text-purple-600">admin / weenland2024</span>
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Navigation Bar when logged in
	if (isLoggedIn) {
		return (
			<>
				<nav className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-40">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center h-20">
							{/* Left side - Brand */}
							<div className="flex items-center">
								<div className="flex items-center">
									<div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mr-4">
										<User size={20} className="text-white" />
									</div>
									<div>
										<h1 className="text-2xl font-bold text-purple-600">
											Weenland Gallery
										</h1>
										<p className="text-sm text-gray-600 -mt-1">Admin Dashboard</p>
									</div>
								</div>
							</div>

							{/* Center - Action buttons (desktop) */}
							<div className="hidden lg:flex items-center space-x-3">
								<button
									onClick={() => setShowUploadForm(true)}
									className="flex items-center gap-3 bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all duration-300">
									<Upload size={18} />
									Upload Image
								</button>

								<button
									onClick={handleSync}
									disabled={isSyncing}
									className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
										isSyncing
											? "bg-gray-400 text-white cursor-not-allowed"
											: "bg-blue-600 text-white hover:bg-blue-700"
									}`}>
									<RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
									{isSyncing ? "Syncing..." : "Sync Images"}
								</button>
							</div>

							{/* Right side - User menu */}
							<div className="flex items-center space-x-4">
								{/* Mobile menu button */}
								<button
									onClick={() => setShowMobileMenu(!showMobileMenu)}
									className="lg:hidden p-3 rounded-2xl text-gray-600 hover:text-purple-600">
									{showMobileMenu ? <X size={22} /> : <Menu size={22} />}
								</button>

								{/* Desktop logout */}
								<button
									onClick={onLogout}
									className="hidden lg:flex items-center gap-3 text-gray-600 hover:text-red-500 px-4 py-3 rounded-2xl hover:bg-red-50">
									<LogOut size={18} />
									Logout
								</button>
							</div>
						</div>

						{/* Mobile menu */}
						{showMobileMenu && (
							<div className="lg:hidden border-t border-gray-200 py-6 space-y-3">
								<button
									onClick={() => {
										setShowUploadForm(true);
										setShowMobileMenu(false);
									}}
									className="flex items-center gap-4 w-full text-left px-6 py-4 text-gray-700 hover:bg-purple-50 rounded-2xl">
									<div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
										<Upload size={18} className="text-white" />
									</div>
									<div>
										<div className="font-semibold">Upload Image</div>
										<div className="text-sm text-gray-500">Add new photos</div>
									</div>
								</button>

								<button
									onClick={() => {
										handleSync();
										setShowMobileMenu(false);
									}}
									disabled={isSyncing}
									className={`flex items-center gap-4 w-full text-left px-6 py-4 rounded-2xl ${
										isSyncing
											? "text-gray-400 cursor-not-allowed"
											: "text-gray-700 hover:bg-blue-50"
									}`}>
									<div
										className={`w-10 h-10 rounded-xl flex items-center justify-center ${
											isSyncing ? "bg-gray-400" : "bg-blue-600"
										}`}>
										<RefreshCw
											size={18}
											className={`text-white ${isSyncing ? "animate-spin" : ""}`}
										/>
									</div>
									<div>
										<div className="font-semibold">
											{isSyncing ? "Syncing..." : "Sync Images"}
										</div>
										<div className="text-sm text-gray-500">Update from cloud storage</div>
									</div>
								</button>

								<div className="border-t border-gray-200 pt-3 mt-6">
									<button
										onClick={onLogout}
										className="flex items-center gap-4 w-full text-left px-6 py-4 text-red-600 hover:bg-red-50 rounded-2xl">
										<div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
											<LogOut size={18} className="text-white" />
										</div>
										<div>
											<div className="font-semibold">Logout</div>
											<div className="text-sm text-red-400">Sign out of admin</div>
										</div>
									</button>
								</div>
							</div>
						)}
					</div>
				</nav>

				{/* Sync Message Toast */}
				{syncMessage && (
					<div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top duration-300">
						<div
							className={`px-6 py-4 rounded-2xl shadow-lg max-w-md ${
								syncMessage.includes("✅")
									? "bg-green-100 text-green-800 border border-green-200"
									: "bg-red-100 text-red-800 border border-red-200"
							}`}>
							<div className="text-sm font-medium">{syncMessage}</div>
						</div>
					</div>
				)}
			</>
		);
	}

	// Login button when not logged in
	return (
		<div className="fixed top-4 right-4 z-50">
			<button
				onClick={() => setShowLoginForm(true)}
				className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl hover:bg-purple-50 hover:text-purple-600 transition-all duration-300 flex items-center gap-3 shadow-lg">
				<User size={18} />
				Admin Access
			</button>
		</div>
	);
};

export default AdminNavBar;
