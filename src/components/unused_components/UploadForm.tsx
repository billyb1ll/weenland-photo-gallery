import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";

interface UploadFormProps {
	onUploadSuccess?: (result: { success: boolean; message: string }) => void;
	onClose?: () => void;
	selectedDay?: number;
}

export default function UploadForm({
	onUploadSuccess,
	onClose,
	selectedDay = 1,
}: UploadFormProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("general");
	const [tags, setTags] = useState("");
	const [day, setDay] = useState(selectedDay);
	const [message, setMessage] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.startsWith("image/")) {
			const file = files[0];
			setSelectedFile(file);
			setTitle(file.name.replace(/\.[^/.]+$/, ""));

			const reader = new FileReader();
			reader.onload = (e) => {
				setPreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setIsUploading(true);
		setUploadProgress(0);
		setMessage("");

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("day", day.toString());
			formData.append("title", title || selectedFile.name);
			formData.append("category", category);
			formData.append("tags", tags);

			// Simulate upload progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 100);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Upload failed");
			}

			const result = await response.json();
			setMessage("✅ อัปโหลดสำเร็จ! Upload successful!");

			if (onUploadSuccess) {
				onUploadSuccess(result);
			}

			// Reset form
			setTimeout(() => {
				setSelectedFile(null);
				setPreview(null);
				setTitle("");
				setTags("");
				setUploadProgress(0);
				setMessage("");
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}, 2000);
		} catch (error) {
			console.error("Upload error:", error);
			setMessage(
				`❌ เกิดข้อผิดพลาด: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
						<Upload className="w-6 h-6 text-blue-600" />
						อัปโหลดรูปภาพ / Upload Image
					</h2>
					{onClose && (
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
							<X className="w-5 h-5" />
						</button>
					)}
				</div>

				<div className="p-6 space-y-6">
					{/* File Drop Zone */}
					<div
						className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
							selectedFile
								? "border-green-500 bg-green-50"
								: "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
						}`}
						onDragOver={handleDragOver}
						onDrop={handleDrop}>
						{preview ? (
							<div className="space-y-4">
								<Image
									src={preview}
									alt="Preview"
									width={200}
									height={200}
									className="mx-auto max-h-48 rounded-lg shadow-md object-contain"
								/>
								<p className="text-sm text-gray-600">{selectedFile?.name}</p>
							</div>
						) : (
							<div className="space-y-4">
								<ImageIcon className="w-16 h-16 text-gray-400 mx-auto" />
								<div>
									<p className="text-lg font-medium text-gray-700">
										ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
									</p>
									<p className="text-sm text-gray-500">
										Drag images here or click to select files
									</p>
								</div>
								<button
									onClick={() => fileInputRef.current?.click()}
									className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
									<Plus className="w-4 h-4" />
									เลือกไฟล์ / Select File
								</button>
							</div>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							className="hidden"
						/>
					</div>

					{/* Form Fields */}
					{selectedFile && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									ชื่อรูปภาพ / Title
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="ใส่ชื่อรูปภาพ..."
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									หมวดหมู่ / Category
								</label>
								<select
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
									<option value="general">ทั่วไป / General</option>
									<option value="nature">ธรรมชาติ / Nature</option>
									<option value="people">บุคคล / People</option>
									<option value="food">อาหาร / Food</option>
									<option value="travel">ท่องเที่ยว / Travel</option>
									<option value="art">ศิลปะ / Art</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									วันที่ / Day
								</label>
								<select
									value={day}
									onChange={(e) => setDay(parseInt(e.target.value))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
									<option value={1}>วันที่ 1 / Day 1</option>
									<option value={2}>วันที่ 2 / Day 2</option>
									<option value={3}>วันที่ 3 / Day 3</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									แท็ก / Tags (คั่นด้วยจุลภาค / comma separated)
								</label>
								<input
									type="text"
									value={tags}
									onChange={(e) => setTags(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="แท็ก1, แท็ก2, แท็ก3..."
								/>
							</div>
						</div>
					)}

					{/* Upload Progress */}
					{isUploading && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm text-gray-600">
								<span>กำลังอัปโหลด... / Uploading...</span>
								<span>{uploadProgress}%</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}

					{/* Message */}
					{message && (
						<div
							className={`p-3 rounded-lg text-sm ${
								message.includes("✅")
									? "bg-green-100 text-green-800"
									: "bg-red-100 text-red-800"
							}`}>
							{message}
						</div>
					)}

					{/* Upload Button */}
					<div className="flex gap-3 pt-4">
						<button
							onClick={handleUpload}
							disabled={!selectedFile || isUploading}
							className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
								selectedFile && !isUploading
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-gray-300 text-gray-500 cursor-not-allowed"
							}`}>
							{isUploading ? "กำลังอัปโหลด... / Uploading..." : "อัปโหลด / Upload"}
						</button>
						{onClose && (
							<button
								onClick={onClose}
								className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
								ยกเลิก / Cancel
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
