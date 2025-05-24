"use client";

import React, { useState } from "react";
import {
	Upload,
	User,
	LogOut,
	Settings,
	Eye,
	EyeOff,
	BarChart3,
	Menu,
	X,
} from "lucide-react";

interface AdminNavBarProps {
	isLoggedIn: boolean;
	onLogin: (success: boolean) => void;
	onLogout: () => void;
	onImageUpload: (file: File, day: number) => void;
}

const AdminNavBar: React.FC<AdminNavBarProps> = ({
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
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);

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
		}, 1000);
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onImageUpload(file, uploadDay);
			setShowUploadModal(false);
		}
	};

	// Login Modal
	if (showLoginForm) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
				<div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50 max-h-[90vh] overflow-y-auto">
					<div className="text-center mb-8">
						<div
							className="w-20 h-20 bg-gradient-to-br from-plum-purple via-purple-600 to-honey-yellow rounded-3xl 
						            flex items-center justify-center mx-auto mb-6 shadow-xl shadow-plum-purple/25">
							<User size={28} className="text-white" />
						</div>
						<h2 className="text-3xl font-bold bg-gradient-to-r from-plum-purple to-purple-600 bg-clip-text text-transparent mb-2">
							Admin Access
						</h2>
						<p className="text-gray-600 font-medium">
							Enter your credentials to continue
						</p>
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
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none 
								         focus:ring-4 focus:ring-plum-purple/20 focus:border-plum-purple
								         transition-all duration-300 bg-gray-50/50 hover:bg-white"
								placeholder="Enter username"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={credentials.password}
									onChange={(e) =>
										setCredentials({ ...credentials, password: e.target.value })
									}
									className="w-full px-6 py-4 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none 
									         focus:ring-4 focus:ring-plum-purple/20 focus:border-plum-purple
									         transition-all duration-300 bg-gray-50/50 hover:bg-white"
									placeholder="Enter password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
									         hover:text-plum-purple transition-colors duration-200 p-1">
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>

						<div className="flex gap-4 pt-6">
							<button
								type="button"
								onClick={() => setShowLoginForm(false)}
								className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl 
								         hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold">
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex-1 bg-gradient-to-r from-plum-purple to-purple-600 text-white 
								         px-6 py-4 rounded-2xl hover:from-purple-600 hover:to-purple-700 
								         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
								         flex items-center justify-center gap-3 font-semibold shadow-xl shadow-plum-purple/25
								         hover:shadow-plum-purple/40 hover:scale-[1.02] transform">
								{isLoading ? (
									<div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									"Sign In"
								)}
							</button>
						</div>
					</form>

					<div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
						<p className="text-sm text-gray-600 text-center">
							<span className="font-semibold">Demo Credentials:</span> <br />
							<span className="font-mono text-plum-purple">admin / weenland2024</span>
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Upload Modal
	if (showUploadModal) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
				<div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50 max-h-[90vh] overflow-y-auto">
					<div className="text-center mb-8">
						<div
							className="w-20 h-20 bg-gradient-to-br from-plum-purple via-purple-600 to-honey-yellow rounded-3xl 
						            flex items-center justify-center mx-auto mb-6 shadow-xl shadow-plum-purple/25">
							<Upload size={28} className="text-white" />
						</div>
						<h2 className="text-3xl font-bold bg-gradient-to-r from-plum-purple to-purple-600 bg-clip-text text-transparent mb-2">
							Upload Image
						</h2>
						<p className="text-gray-600 font-medium">
							Add a new photo to your gallery
						</p>
					</div>

					<div className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								Day Assignment
							</label>
							<select
								value={uploadDay}
								onChange={(e) => setUploadDay(Number(e.target.value))}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none 
								         focus:ring-4 focus:ring-plum-purple/20 focus:border-plum-purple
								         transition-all duration-300 bg-gray-50/50 hover:bg-white cursor-pointer">
								{[1, 2, 3].map((day) => (
									<option key={day} value={day}>
										Day {day}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								Select Image File
							</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleFileUpload}
								className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl 
								         file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0
								         file:text-sm file:font-semibold file:bg-gradient-to-r file:from-plum-purple/10 file:to-purple-600/10
								         file:text-plum-purple hover:file:from-plum-purple/20 hover:file:to-purple-600/20
								         cursor-pointer transition-all duration-300 bg-gray-50/50 hover:bg-white
								         focus:outline-none focus:ring-4 focus:ring-plum-purple/20 focus:border-plum-purple"
							/>
						</div>

						<div className="flex gap-4 pt-6">
							<button
								type="button"
								onClick={() => setShowUploadModal(false)}
								className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl 
								         hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold">
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Navigation Bar when logged in
	if (isLoggedIn) {
		return (
			<nav className="bg-gradient-to-r from-plum-purple/5 via-white to-honey-yellow/5 border-b border-gray-200/80 shadow-lg backdrop-blur-md sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-20">
						{/* Left side - Brand */}
						<div className="flex items-center">
							<div className="flex-shrink-0 flex items-center">
								<div
									className="w-12 h-12 bg-gradient-to-br from-plum-purple via-purple-600 to-honey-yellow rounded-2xl 
								            flex items-center justify-center mr-4 shadow-lg shadow-plum-purple/25">
									<User size={20} className="text-white" />
								</div>
								<div className="hidden sm:block">
									<h1 className="text-2xl font-bold bg-gradient-to-r from-plum-purple to-purple-600 bg-clip-text text-transparent">
										WEENLAND
									</h1>
									<p className="text-sm text-gray-600 font-medium -mt-1">
										Admin Dashboard
									</p>
								</div>
							</div>
						</div>

						{/* Center - Quick Actions (Desktop) */}
						<div className="hidden lg:flex items-center space-x-3">
							<button
								onClick={() => setShowUploadModal(true)}
								className="flex items-center gap-3 bg-gradient-to-r from-plum-purple to-purple-600 
								         text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-purple-700 
								         transition-all duration-300 text-sm font-semibold shadow-lg shadow-plum-purple/25 
								         hover:shadow-plum-purple/40 hover:scale-105 transform">
								<Upload size={18} />
								Upload Image
							</button>

							<button
								className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-gray-700 px-5 py-3 
							                 rounded-2xl hover:bg-white hover:text-plum-purple transition-all duration-300 
							                 text-sm font-semibold border border-gray-200/50 shadow-md hover:shadow-lg
							                 hover:scale-105 transform">
								<BarChart3 size={18} />
								Analytics
							</button>

							<button
								className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-gray-700 px-5 py-3 
							                 rounded-2xl hover:bg-white hover:text-plum-purple transition-all duration-300 
							                 text-sm font-semibold border border-gray-200/50 shadow-md hover:shadow-lg
							                 hover:scale-105 transform">
								<Settings size={18} />
								Settings
							</button>
						</div>

						{/* Right side - User menu */}
						<div className="flex items-center space-x-4">
							{/* Mobile menu button */}
							<button
								onClick={() => setShowMobileMenu(!showMobileMenu)}
								className="lg:hidden p-3 rounded-2xl text-gray-600 hover:text-plum-purple 
								         hover:bg-white/80 backdrop-blur-sm transition-all duration-300 border border-gray-200/50">
								{showMobileMenu ? <X size={22} /> : <Menu size={22} />}
							</button>

							{/* Desktop logout */}
							<button
								onClick={onLogout}
								className="hidden lg:flex items-center gap-3 text-gray-600 hover:text-red-500 
								         px-4 py-3 rounded-2xl hover:bg-red-50 backdrop-blur-sm transition-all duration-300 
								         text-sm font-semibold border border-gray-200/50 hover:border-red-200">
								<LogOut size={18} />
								Logout
							</button>
						</div>
					</div>

					{/* Mobile menu */}
					{showMobileMenu && (
						<div className="lg:hidden border-t border-gray-200/50 py-6 space-y-3 bg-white/95 backdrop-blur-md">
							<button
								onClick={() => {
									setShowUploadModal(true);
									setShowMobileMenu(false);
								}}
								className="flex items-center gap-4 w-full text-left px-6 py-4 text-gray-700 
								         hover:bg-gradient-to-r hover:from-plum-purple/10 hover:to-purple-600/10 
								         rounded-2xl transition-all duration-300 font-medium">
								<div className="w-10 h-10 bg-gradient-to-r from-plum-purple to-purple-600 rounded-xl flex items-center justify-center">
									<Upload size={18} className="text-white" />
								</div>
								<div>
									<div className="font-semibold">Upload Image</div>
									<div className="text-sm text-gray-500">Add new photos</div>
								</div>
							</button>

							<button
								className="flex items-center gap-4 w-full text-left px-6 py-4 text-gray-700 
							                 hover:bg-gradient-to-r hover:from-plum-purple/10 hover:to-purple-600/10 
							                 rounded-2xl transition-all duration-300 font-medium">
								<div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
									<BarChart3 size={18} className="text-white" />
								</div>
								<div>
									<div className="font-semibold">Analytics</div>
									<div className="text-sm text-gray-500">View statistics</div>
								</div>
							</button>

							<button
								className="flex items-center gap-4 w-full text-left px-6 py-4 text-gray-700 
							                 hover:bg-gradient-to-r hover:from-plum-purple/10 hover:to-purple-600/10 
							                 rounded-2xl transition-all duration-300 font-medium">
								<div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
									<Settings size={18} className="text-white" />
								</div>
								<div>
									<div className="font-semibold">Settings</div>
									<div className="text-sm text-gray-500">Configure app</div>
								</div>
							</button>

							<div className="border-t border-gray-200/50 pt-3 mt-6">
								<button
									onClick={onLogout}
									className="flex items-center gap-4 w-full text-left px-6 py-4 text-red-600 
									         hover:bg-red-50 rounded-2xl transition-all duration-300 font-medium">
									<div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
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
		);
	}

	// Login button when not logged in
	return (
		<div className="fixed top-4 right-4 z-50">
			<button
				onClick={() => setShowLoginForm(true)}
				className="bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-700 px-6 py-3 rounded-2xl 
				         hover:bg-white hover:text-plum-purple transition-all duration-300 flex items-center gap-3 shadow-lg
				         font-semibold hover:scale-105 transform">
				<User size={18} />
				Admin Access
			</button>
		</div>
	);
};

export default AdminNavBar;
