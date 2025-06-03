import React, { useMemo } from "react";
import { BarChart3, Images, Star, HardDrive, Clock } from "lucide-react";

interface AdminStatsPanelProps {
	totalImages: number;
	highlightedImages: number;
	totalDays: number;
	storageUsed: string;
	lastUpdate: Date | null;
	isAuthenticated: boolean;
}

const AdminStatsPanel: React.FC<AdminStatsPanelProps> = ({
	totalImages,
	highlightedImages,
	totalDays,
	storageUsed,
	lastUpdate,
	isAuthenticated,
}) => {
	const stats = useMemo(
		() => [
			{
				icon: Images,
				label: "Total Images",
				value: totalImages.toLocaleString(),
				color: "text-blue-600",
				bgColor: "bg-blue-50",
			},
			{
				icon: Star,
				label: "Highlighted",
				value: highlightedImages.toLocaleString(),
				color: "text-yellow-600",
				bgColor: "bg-yellow-50",
			},
			{
				icon: BarChart3,
				label: "Total Days",
				value: totalDays.toLocaleString(),
				color: "text-green-600",
				bgColor: "bg-green-50",
			},
			{
				icon: HardDrive,
				label: "Storage Used",
				value: storageUsed,
				color: "text-purple-600",
				bgColor: "bg-purple-50",
			},
		],
		[totalImages, highlightedImages, totalDays, storageUsed]
	);

	if (!isAuthenticated) return null;

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			{stats.map((stat, index) => {
				const IconComponent = stat.icon;
				return (
					<div
						key={index}
						className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}>
						<div className="flex items-center">
							<div className={`${stat.color} mr-3`}>
								<IconComponent className="w-6 h-6" />
							</div>
							<div>
								<p className="text-sm font-medium text-gray-600">{stat.label}</p>
								<p className="text-lg font-semibold text-gray-900">{stat.value}</p>
							</div>
						</div>
					</div>
				);
			})}

			{lastUpdate && (
				<div className="lg:col-span-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
					<div className="flex items-center">
						<Clock className="w-5 h-5 text-gray-500 mr-2" />
						<span className="text-sm text-gray-600">
							Last updated: {lastUpdate.toLocaleString()}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminStatsPanel;
