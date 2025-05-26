// Type definitions for the photo gallery application

export interface ImageData {
	id: string;
	title: string;
	category: string;
	tags: string[];
	thumbnailUrl: string;
	fullUrl: string;
	uploadDate: string;
	day?: string;
	size?: number;
	dimensions?: {
		width: number;
		height: number;
	};
}

export interface GalleryState {
	images: ImageData[];
	selectedImages: Set<string>;
	favorites: Set<string>;
	searchTerm: string;
	selectedCategory: string;
	currentPage: number;
	hasMore: boolean;
	isLoading: boolean;
}

export interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	user?: {
		username: string;
		role: "admin" | "user";
	};
}

export interface UploadProgress {
	id: string;
	filename: string;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	error?: string;
}

export interface CompressionSettings {
	thumbnailQuality: number;
	fullSizeQuality: number;
	enableWebP: boolean;
	maxWidth: number;
	maxHeight: number;
}

export interface LightboxState {
	isOpen: boolean;
	currentIndex: number;
	images: ImageData[];
}

export interface FilterOptions {
	categories: string[];
	tags: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface CloudStorageConfig {
	projectId: string;
	bucketName: string;
	credentials: string;
	baseUrl: string;
}
