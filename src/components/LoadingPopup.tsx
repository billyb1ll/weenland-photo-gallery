"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";

interface LoadingPopupProps {
	isVisible: boolean;
	message: string;
	progress?: number;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({
	isVisible,
	message,
	progress,
}) => {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
			<div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-200/50 transform animate-fade-in-up">
				<div className="text-center">
					{/* Loading Icon */}
					<div
						className="w-20 h-20 bg-gradient-to-br from-plum-purple via-purple-600 to-honey-yellow rounded-3xl 
					            flex items-center justify-center mx-auto mb-6 shadow-xl shadow-plum-purple/25 relative">
						<Download size={28} className="text-white" />
						<div className="absolute inset-0 rounded-3xl border-4 border-white/20">
							<div className="absolute inset-0 rounded-3xl overflow-hidden">
								<div
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
								              animate-shimmer transform -skew-x-12"></div>
							</div>
						</div>
					</div>

					{/* Loading Message */}
					<h3
						className="text-xl font-bold text-plum-purple bg-gradient-to-r from-plum-purple to-purple-600 bg-clip-text mb-2"
						style={{
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}>
						{message}
					</h3>

					{/* Progress Bar (if progress is provided) */}
					{progress !== undefined && (
						<div className="mb-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-gradient-to-r from-plum-purple to-purple-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}></div>
							</div>
							<p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
						</div>
					)}

					{/* Spinning Loader */}
					<div className="flex items-center justify-center gap-3 text-gray-600">
						<Loader2 size={20} className="animate-spin text-plum-purple" />
						<span className="text-sm font-medium">
							{progress !== undefined ? "Creating ZIP file..." : "Please wait..."}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoadingPopup;
