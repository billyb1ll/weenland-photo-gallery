"use client";

import React, { useEffect, useRef } from "react";

interface PerformanceGraphProps {
	memoryUsage: number;
	imageLoadTime?: number;
	renderTime?: number;
	height?: number;
	width?: number;
}

/**
 * A mini performance graph for displaying in the admin interface
 */
const PerformanceGraph: React.FC<PerformanceGraphProps> = ({
	memoryUsage,
	imageLoadTime,
	renderTime,
	height = 40,
	width = 150,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Data points for the mini graphs
	const memoryHistory = useRef<number[]>([]);
	const loadTimeHistory = useRef<number[]>([]);
	const renderTimeHistory = useRef<number[]>([]);

	// Maximum points to store
	const MAX_POINTS = 15;

	// Update the history with new data points
	useEffect(() => {
		// Update memory usage history
		if (typeof memoryUsage === "number") {
			memoryHistory.current.push(memoryUsage);
			if (memoryHistory.current.length > MAX_POINTS) {
				memoryHistory.current.shift();
			}
		}

		// Update load time history if provided
		if (typeof imageLoadTime === "number") {
			loadTimeHistory.current.push(imageLoadTime);
			if (loadTimeHistory.current.length > MAX_POINTS) {
				loadTimeHistory.current.shift();
			}
		}

		// Update render time history if provided
		if (typeof renderTime === "number") {
			renderTimeHistory.current.push(renderTime);
			if (renderTimeHistory.current.length > MAX_POINTS) {
				renderTimeHistory.current.shift();
			}
		}

		// Draw the graph
		drawGraph();
	}, [memoryUsage, imageLoadTime, renderTime]);

	// Draw the graph on the canvas
	const drawGraph = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Set up the graph dimensions
		const graphHeight = canvas.height - 4;
		const graphWidth = canvas.width - 4;

		// Draw memory usage line
		if (memoryHistory.current.length > 1) {
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
			ctx.lineWidth = 2;

			const pointSpacing = graphWidth / (MAX_POINTS - 1);

			memoryHistory.current.forEach((value, index) => {
				// Scale value to fit in graph (memory % from 0-100)
				const y = graphHeight - (value / 100) * graphHeight + 2;
				const x = index * pointSpacing + 2;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();
		}

		// Draw load time line if available
		if (loadTimeHistory.current.length > 1) {
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255, 223, 126, 0.6)";
			ctx.lineWidth = 1.5;

			// Find max load time for scaling
			const maxLoadTime = Math.max(...loadTimeHistory.current, 500); // min 500ms for scale
			const pointSpacing = graphWidth / (MAX_POINTS - 1);

			loadTimeHistory.current.forEach((value, index) => {
				// Scale value to fit in graph (load time inversely proportional)
				const y = graphHeight - (value / maxLoadTime) * graphHeight * 0.7 + 2;
				const x = index * pointSpacing + 2;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();
		}
	};

	return (
		<div className="bg-black/20 rounded-md p-1">
			<canvas
				ref={canvasRef}
				width={width}
				height={height}
				className="w-full h-auto"
			/>
			<div className="flex justify-between text-[10px] text-white/50 px-1">
				<span>Memory</span>
				{loadTimeHistory.current.length > 0 && <span>Load</span>}
			</div>
		</div>
	);
};

export default PerformanceGraph;
