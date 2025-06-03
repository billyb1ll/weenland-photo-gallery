const fs = require('fs');
const path = require('path');

// Convert existing images.json to array format
const srcImagesPath = path.join(process.cwd(), 'src/data/images.json');
const publicImagesPath = path.join(process.cwd(), 'public/data/images.json');

try {
    // Read existing data
    const existingJson = fs.readFileSync(srcImagesPath, 'utf-8');
    const existingData = JSON.parse(existingJson);

    // Convert to array format if not already
    let imagesArray;
    if (!Array.isArray(existingData)) {
        imagesArray = Object.entries(existingData).map(([filename, img], index) => ({
            id: index + 1, // Create sequential IDs
            thumbnailUrl: img.thumbnailUrl,
            fullUrl: img.fullUrl,
            title: img.title || filename,
            day: img.day || 1,
            uploadDate: img.uploadDate || new Date().toISOString(),
            gcsPath: img.gcsPath,
            filename: filename
        }));
        console.log(`✅ Converted ${imagesArray.length} images from object to array format`);
    } else {
        imagesArray = existingData;
        console.log('Images are already in array format');
    }

    // Ensure directories exist
    fs.mkdirSync(path.dirname(srcImagesPath), { recursive: true });
    fs.mkdirSync(path.dirname(publicImagesPath), { recursive: true });

    // Write updated data back to both locations
    fs.writeFileSync(srcImagesPath, JSON.stringify(imagesArray, null, 2));
    fs.writeFileSync(publicImagesPath, JSON.stringify(imagesArray, null, 2));

    console.log('✅ Updated both src/data/images.json and public/data/images.json');
} catch (error) {
    console.error('❌ Error updating images.json:', error);
}
