"use client";

import React, { useState } from "react";
import { Settings, Zap } from "lucide-react";
import {
	COMPRESSION_PRESETS,
	formatFileSize,
	getCompressionRatio,
} from "@/lib/image-compressor";

interface CompressionSettingsProps {
	onCompress: (preset: keyof typeof COMPRESSION_PRESETS) => Promise<void>;
	originalSize: number;
	compressedSize: number;
	disabled?: boolean;
}

// Compression options with display names
const compressionOptions = [
	{
		value: "HIGH",
		label: "High Quality",
		description: "90% quality, WebP format",
	},
	{
		value: "MEDIUM",
		label: "Medium Quality",
		description: "75% quality, WebP format",
	},
	{
		value: "LOW",
		label: "Low Quality",
		description: "60% quality, WebP format",
	},
	{
		value: "STORAGE_OPTIMIZED",
		label: "Storage Optimized",
		description: "Balanced compression",
	},
	{ value: "NONE", label: "No Compression", description: "Original files" },
];

/**
 * A component that provides image compression settings for large collections
 */
const CompressionSettings: React.FC<CompressionSettingsProps> = ({
	onCompress,
	originalSize,
	compressedSize,
	disabled = false,
}) => {
	const [compressionSetting, setCompressionSetting] = useState<string>("MEDIUM");
	const [showSettings, setShowSettings] = useState(false);

	const handleCompressClick = async () => {
		if (compressionSetting === "NONE") return;
		await onCompress(compressionSetting as keyof typeof COMPRESSION_PRESETS);
	};

	return (
		<div className="mt-2">
			<div className="flex justify-between items-center">
				<label className="block text-sm font-medium text-gray-700">
					Compression Settings
				</label>
				<button
					type="button"
					onClick={() => setShowSettings(!showSettings)}
					className="text-xs text-plum-purple hover:text-purple-700 flex items-center gap-1"
					disabled={disabled}>
					<Settings size={14} />
					{showSettings ? "Hide Settings" : "Show Settings"}
				</button>
			</div>

			{showSettings && (
				<div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
					<div className="space-y-2">
						{compressionOptions.map((option) => (
							<div key={option.value} className="flex items-center">
								<input
									type="radio"
									id={`compression-${option.value}`}
									name="compression"
									value={option.value}
									checked={compressionSetting === option.value}
									onChange={() => setCompressionSetting(option.value)}
									className="mr-2 text-plum-purple focus:ring-plum-purple"
									disabled={disabled}
								/>
								<label
									htmlFor={`compression-${option.value}`}
									className="flex flex-col">
									<span className="text-sm font-medium">{option.label}</span>
									<span className="text-xs text-gray-500">{option.description}</span>
								</label>
							</div>
						))}
					</div>

					{/* Compression statistics */}
					{originalSize > 0 && (
						<div className="mt-3 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Original Size:</span>
								<span className="font-medium">{formatFileSize(originalSize)}</span>
							</div>
							{compressedSize > 0 && compressedSize < originalSize && (
								<>
									<div className="flex justify-between">
										<span className="text-gray-600">After Compression:</span>
										<span className="font-medium">{formatFileSize(compressedSize)}</span>
									</div>
									<div className="flex justify-between text-green-600">
										<span>Space Saved:</span>
										<span className="font-medium">
											{getCompressionRatio(originalSize, compressedSize)}
										</span>
									</div>
								</>
							)}
							{compressionSetting !== "NONE" &&
								(compressedSize === 0 || compressedSize === originalSize) && (
									<div className="mt-2">
										<button
											onClick={handleCompressClick}
											className="w-full py-1 px-2 bg-plum-purple/10 hover:bg-plum-purple/20 text-plum-purple rounded flex items-center justify-center gap-1 text-sm"
											disabled={disabled}>
											<Zap size={14} />
											Apply Compression
										</button>
									</div>
								)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default CompressionSettings;
