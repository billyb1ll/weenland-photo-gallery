const { Storage } = require('@google-cloud/storage');
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

async function testListImages() {
    try {
        console.log('🔍 Fetching all files with "images/" prefix...');
        const [files] = await bucket.getFiles({
            prefix: "images/",
        });

        console.log(`📁 Found ${files.length} total files`);

        // Show all files
        console.log('\n📄 All files:');
        files.forEach(file => {
            console.log(`  ${file.name}`);
        });

        // Filter for full/originals images
        const fullImages = files.filter(
            (file) => (file.name.includes("/full/") || file.name.includes("/originals/")) && !file.name.endsWith("/")
        );

        console.log(`\n🖼️  Found ${fullImages.length} image files (with /full/ or /originals/):`);

        for (const file of fullImages) {
            try {
                const [metadata] = await file.getMetadata();
                const customMetadata = metadata.metadata || {};

                // Extract day from path
                const dayMatch = file.name.match(/day-(\d+)/);
                const day = dayMatch ? parseInt(dayMatch[1]) : 1;

                console.log(`  📸 ${file.name}`);
                console.log(`     Day: ${day}`);
                console.log(`     Size: ${metadata.size} bytes`);
                console.log(`     Created: ${metadata.timeCreated}`);
                console.log(`     Original Name: ${customMetadata.originalName || 'N/A'}`);
                console.log('');
            } catch (error) {
                console.error(`    ❌ Error processing ${file.name}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error listing images:', error.message);
    }
}

testListImages();
