const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Google Cloud Storage
const initStorage = () => {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        return new Storage({ projectId, credentials });
    } else {
        return new Storage({
            projectId,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }
};

const storage = initStorage();
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "weenland-gallery-images-2025";
const bucket = storage.bucket(bucketName);

async function listImagesFromGCS() {
    try {
        const [files] = await bucket.getFiles({
            prefix: "images/",
        });

        const images = [];

        // Filter only full images (not thumbnails)
        const fullImages = files.filter(
            (file) => file.name.includes("/full/") && !file.name.endsWith("/")
        );

        for (const file of fullImages) {
            try {
                const [metadata] = await file.getMetadata();
                const customMetadata = metadata.metadata || {};

                // Extract day from path
                const dayMatch = file.name.match(/day-(\d+)/);
                const day = dayMatch ? parseInt(dayMatch[1]) : 1;

                // Generate thumbnail path
                const thumbnailPath = file.name
                    .replace("/full/", "/thumbnails/")
                    .replace(/(\.[^.]+)$/, "_thumb$1");

                const fullUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
                const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${thumbnailPath}`;

                // Extract timestamp from filename
                const timestampMatch = file.name.match(/(\d+)-/);
                const id = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

                const title = String(
                    customMetadata.originalName ||
                    path
                        .basename(file.name)
                        .replace(/^\d+-/, "")
                        .replace(/\.[^.]+$/, "")
                );

                images.push({
                    id,
                    thumbnailUrl,
                    fullUrl,
                    title,
                    category: "uploaded",
                    tags: [`day-${day}`, "uploaded"],
                    day,
                    uploadDate: String(
                        customMetadata.uploadDate ||
                        metadata.timeCreated ||
                        new Date().toISOString()
                    ),
                    gcsPath: file.name,
                });
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                // Continue with other files
            }
        }

        // Sort by upload date (newest first)
        return images.sort(
            (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
    } catch (error) {
        console.error("Error listing images from GCS:", error);
        throw new Error(
            `Failed to list images: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

async function syncImages() {
    try {
        console.log('🔄 Syncing images from Google Cloud Storage...');
        const images = await listImagesFromGCS();
        console.log(`📷 Found ${images.length} images`);

        if (images.length > 0) {
            console.log('📝 Sample image:');
            console.log(JSON.stringify(images[0], null, 2));
        }

        const publicPath = path.join(process.cwd(), 'public/data/images.json');
        const srcPath = path.join(process.cwd(), 'src/data/images.json');

        // Ensure directories exist
        fs.mkdirSync(path.dirname(publicPath), { recursive: true });
        fs.mkdirSync(path.dirname(srcPath), { recursive: true });

        const jsonContent = JSON.stringify(images, null, 2);
        fs.writeFileSync(publicPath, jsonContent);
        fs.writeFileSync(srcPath, jsonContent);

        console.log('✅ Images synced successfully!');
        console.log(`📂 Saved to: ${publicPath}`);
        console.log(`📂 Saved to: ${srcPath}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

syncImages();
