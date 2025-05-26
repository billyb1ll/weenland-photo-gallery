// Global type declarations for Weenland Photo Gallery

interface WeenlandGlobal {
	forceMemoryCleanup?: () => void;
	toggleAggressiveOptimization?: () => void;
	performance?: {
		loadTime?: number;
		renderTime?: number;
		imageLoadAvg?: number;
	};
}

interface Window {
	weenland?: WeenlandGlobal;
}
