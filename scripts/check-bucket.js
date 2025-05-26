#!/usr/bin/env node

// Simple bucket verification script
console.log('🔍 Checking if bucket exists and is accessible...');

const https = require('https');

const bucketName = 'weenland-gallery-images-2025';
const bucketUrl = `https://storage.googleapis.com/${bucketName}/`;

console.log(`Testing public access to: ${bucketUrl}`);

https.get(bucketUrl, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Bucket exists and is accessible');
    } else if (res.statusCode === 403) {
        console.log('❌ Bucket exists but access denied - check permissions');
    } else {
        console.log('❓ Unexpected response');
    }
}).on('error', (err) => {
    console.log('❌ Error:', err.message);
});
