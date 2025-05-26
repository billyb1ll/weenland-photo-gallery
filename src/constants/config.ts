// App configuration constants
export const APP_CONFIG = {
	NAME: "WEENLAND Photo Gallery",
	VERSION: "1.0.0",
	DESCRIPTION: "A modern photo gallery with Google Cloud Storage integration",
	AUTHOR: "WEENLAND Team",
} as const;

// Image processing constants
export const IMAGE_CONFIG = {
	THUMBNAIL_SIZE: 300,
	MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
	SUPPORTED_FORMATS: ["jpg", "jpeg", "png", "webp"],
	QUALITY: {
		THUMBNAIL: 80,
		FULL_SIZE: 90,
	},
} as const;

// Gallery display constants
export const GALLERY_CONFIG = {
	ITEMS_PER_PAGE: 20,
	GRID_BREAKPOINTS: {
		SM: 1, // 1 column on small screens
		MD: 2, // 2 columns on medium screens
		LG: 3, // 3 columns on large screens
		XL: 4, // 4 columns on extra large screens
	},
} as const;

// API endpoints
export const API_ENDPOINTS = {
	IMAGES: "/api/images",
	UPLOAD: "/api/upload",
	DOWNLOAD_BATCH: "/api/download-batch",
	SYNC: "/api/sync",
	AUTH: {
		LOGIN: "/api/auth/login",
		LOGOUT: "/api/auth/logout",
		VERIFY: "/api/auth/verify",
	},
} as const;

// UI constants
export const UI_CONFIG = {
	ANIMATION_DURATION: 200,
	DEBOUNCE_DELAY: 300,
	TOAST_DURATION: 3000,
} as const;
