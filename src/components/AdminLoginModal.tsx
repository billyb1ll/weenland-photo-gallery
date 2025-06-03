import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

interface AdminLoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLogin: (username: string, password: string) => Promise<void>;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
	isOpen,
	onClose,
	onLogin,
}) => {
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) return;

		setIsLoading(true);
		setError("");

		try {
			await onLogin(username, password);
			setUsername("admin");
			setPassword("");
			onClose();
		} catch {
			setError("Invalid credentials");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setUsername("admin");
		setPassword("");
		setError("");
		setShowPassword(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-gray-900">Admin Login</h2>
					<button
						onClick={handleClose}
						className="p-1 hover:bg-gray-100 rounded-full transition-colors"
						disabled={isLoading}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Username"
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						/>
					</div>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter admin password"
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
							disabled={isLoading}
							autoFocus
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
							disabled={isLoading}>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>

					{error && <p className="text-red-600 text-sm">{error}</p>}

					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							disabled={isLoading}>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!username.trim() || !password.trim() || isLoading}
							className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
							{isLoading ? "Logging in..." : "Login"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AdminLoginModal;
