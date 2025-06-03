"use client";

import React, { useState } from "react";
import {
	CheckSquare,
	Trash2,
	Download,
	Folder,
	X,
	Info,
	AlertTriangle,
	CheckCircle2,
} from "lucide-react";

interface BatchOperationsProps {
	selectedCount: number;
	isSelectionMode: boolean;
	onToggleSelectionMode: () => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onDownloadSelected: () => void;
	onDeleteSelected: () => void;
	onMoveSelected: (day: number) => void;
	disabled?: boolean;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
	selectedCount,
	isSelectionMode,
	onToggleSelectionMode,
	onSelectAll,
	onClearSelection,
	onDownloadSelected,
	onDeleteSelected,
	onMoveSelected,
	disabled = false,
}) => {
	const [showDayInput, setShowDayInput] = useState(false);
	const [newDay, setNewDay] = useState<number>(1);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [operationStatus, setOperationStatus] = useState<{
		type: "success" | "error" | "info" | null;
		message: string;
	}>({ type: null, message: "" });

	// Helper for showing status messages
	const showStatus = (type: "success" | "error" | "info", message: string) => {
		setOperationStatus({ type, message });
		setTimeout(() => setOperationStatus({ type: null, message: "" }), 3000);
	};

	// Handle move/day submission
	const handleDaySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (newDay >= 1 && newDay <= 9) {
			onMoveSelected(newDay);
			setShowDayInput(false);
			showStatus("success", `Moved ${selectedCount} images to Day ${newDay}`);
		} else {
			showStatus("error", "Day must be between 1 and 9");
		}
	};

	// Handle delete confirmation
	const handleDelete = () => {
		if (confirmDelete) {
			onDeleteSelected();
			setConfirmDelete(false);
			showStatus("info", `Deleted ${selectedCount} images`);
		} else {
			setConfirmDelete(true);
			// Auto-reset confirmation after 5 seconds
			setTimeout(() => setConfirmDelete(false), 5000);
		}
	};

	if (!isSelectionMode) {
		return (
			<button
				onClick={onToggleSelectionMode}
				className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-105"
				title="Enter selection mode"
				disabled={disabled}>
				<CheckSquare size={24} />
			</button>
		);
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 transform translate-y-0">
			{/* Status message */}
			{operationStatus.type && (
				<div
					className={`absolute top-0 left-0 right-0 transform -translate-y-full p-2 flex items-center justify-center ${
						operationStatus.type === "success"
							? "bg-green-100 text-green-800"
							: operationStatus.type === "error"
							? "bg-red-100 text-red-800"
							: "bg-blue-100 text-blue-800"
					}`}>
					{operationStatus.type === "success" && (
						<CheckCircle2 size={16} className="mr-2" />
					)}
					{operationStatus.type === "error" && (
						<AlertTriangle size={16} className="mr-2" />
					)}
					{operationStatus.type === "info" && <Info size={16} className="mr-2" />}
					{operationStatus.message}
				</div>
			)}

			<div className="container mx-auto px-4 py-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					{/* Selection info */}
					<div className="flex items-center gap-2">
						<span className="font-medium">
							{selectedCount} image{selectedCount !== 1 ? "s" : ""} selected
						</span>
						<button
							onClick={onClearSelection}
							className="text-gray-500 hover:text-gray-700"
							title="Clear selection">
							<X size={18} />
						</button>
					</div>

					{/* Action buttons */}
					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={onSelectAll}
							className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 text-sm"
							title="Select all visible images">
							<CheckSquare size={16} />
							<span className="hidden sm:inline">Select All</span>
						</button>

						<button
							onClick={onDownloadSelected}
							className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 text-sm"
							title="Download selected images"
							disabled={selectedCount === 0 || disabled}>
							<Download size={16} />
							<span className="hidden sm:inline">Download</span>
						</button>

						<button
							onClick={() => setShowDayInput(!showDayInput)}
							className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 text-sm"
							title="Move selected images to a different day"
							disabled={selectedCount === 0 || disabled}>
							<Folder size={16} />
							<span className="hidden sm:inline">Move</span>
						</button>

						<button
							onClick={handleDelete}
							className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${
								confirmDelete
									? "bg-red-500 text-white hover:bg-red-600"
									: "bg-gray-100 hover:bg-gray-200 text-gray-700"
							}`}
							title="Delete selected images"
							disabled={selectedCount === 0 || disabled}>
							<Trash2 size={16} />
							<span className="hidden sm:inline">
								{confirmDelete ? "Confirm Delete" : "Delete"}
							</span>
						</button>

						<button
							onClick={onToggleSelectionMode}
							className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
							title="Exit selection mode">
							<span>Done</span>
						</button>
					</div>
				</div>

				{/* Day/move input form */}
				{showDayInput && (
					<div className="mt-2 p-3 bg-gray-50 rounded-lg">
						<form onSubmit={handleDaySubmit} className="flex gap-2">
							<label className="flex items-center">
								<span className="mr-2">Move to Day:</span>
								<input
									type="number"
									value={newDay}
									onChange={(e) => setNewDay(parseInt(e.target.value))}
									min={1}
									max={9}
									className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
									autoFocus
								/>
							</label>
							<button
								type="submit"
								className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
								disabled={newDay < 1 || newDay > 9}>
								Move
							</button>
							<button
								type="button"
								onClick={() => setShowDayInput(false)}
								className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg">
								Cancel
							</button>
						</form>
						<div className="mt-1 text-xs text-gray-500">
							Moving images will change their assigned day. Please choose a day between
							1 and 9.
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default BatchOperations;
