import { writeFile, mkdir, readdir, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { UploadResult } from "./storage";

const MOCK_STORAGE_DIR = path.join(process.cwd(), "public", "mock-uploads");
const METADATA_FILE = path.join(MOCK_STORAGE_DIR, "metadata.json");

interface MockMetadata {
	photos: UploadResult[];
	nextId: number;
}

// Ensure mock storage directory exists
async function ensureStorageDir() {
	try {
		await mkdir(MOCK_STORAGE_DIR, { recursive: true });
		await mkdir(path.join(MOCK_STORAGE_DIR, "thumbnails"), { recursive: true });
		await mkdir(path.join(MOCK_STORAGE_DIR, "full"), { recursive: true });
	} catch (error) {
		// Directory already exists
	}
}

// Load metadata
async function loadMetadata(): Promise<MockMetadata> {
	try {
		const data = await readFile(METADATA_FILE, "utf-8");
		return JSON.parse(data);
	} catch {
		return { photos: [], nextId: 1 };
	}
}

// Save metadata
async function saveMetadata(metadata: MockMetadata) {
	await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

export async function mockUploadImage(
	imageBuffer: Buffer,
	originalName: string,
	day: number,
	title?: string,
	category?: string,
	tags?: string[]
): Promise<UploadResult> {
	await ensureStorageDir();

	const metadata = await loadMetadata();
	const id = metadata.nextId++;

	// Generate filename without extension for processing
	const nameWithoutExt = path.parse(originalName).name;
	const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, "_");

	// Create thumbnail
	const thumbnailBuffer = await sharp(imageBuffer)
		.resize(300, 300, { fit: "cover" })
		.jpeg({ quality: 80 })
		.toBuffer();

	// Create full-size optimized image
	const fullBuffer = await sharp(imageBuffer)
		.resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
		.jpeg({ quality: 85 })
		.toBuffer();

	// Save files
	const thumbnailFilename = `${safeName}_${id}_thumb.jpg`;
	const fullFilename = `${safeName}_${id}_full.jpg`;

	await writeFile(
		path.join(MOCK_STORAGE_DIR, "thumbnails", thumbnailFilename),
		thumbnailBuffer
	);
	await writeFile(path.join(MOCK_STORAGE_DIR, "full", fullFilename), fullBuffer);

	// Create upload result
	const uploadResult: UploadResult = {
		id,
		thumbnailUrl: `/mock-uploads/thumbnails/${thumbnailFilename}`,
		fullUrl: `/mock-uploads/full/${fullFilename}`,
		title: title || safeName,
		category: category || "general",
		tags: tags || [],
		day,
		uploadDate: new Date().toISOString(),
		gcsPath: `mock://day-${day}/${fullFilename}`,
	};

	// Save metadata
	metadata.photos.push(uploadResult);
	await saveMetadata(metadata);

	return uploadResult;
}

export async function mockListImages(): Promise<UploadResult[]> {
	const metadata = await loadMetadata();
	return metadata.photos;
}

export async function mockDeleteImage(id: number): Promise<boolean> {
	const metadata = await loadMetadata();
	const photoIndex = metadata.photos.findIndex((p) => p.id === id);

	if (photoIndex === -1) return false;

	// Remove from metadata
	metadata.photos.splice(photoIndex, 1);
	await saveMetadata(metadata);

	return true;
}

export async function mockSyncImages(): Promise<{
	added: number;
	errors: string[];
}> {
	// Mock sync - in a real scenario this would sync with external storage
	return { added: 0, errors: [] };
}
