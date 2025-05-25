#!/usr/bin/env node

// Test uploading an image through the API
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🧪 Testing Upload API...');

    // Create a simple test image (1x1 pixel PNG)
    const testImageData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    try {
        const FormData = require('form-data');
        const { default: fetch } = require('node-fetch');

        const formData = new FormData();
        formData.append('file', testImageData, {
            filename: 'test-image.png',
            contentType: 'image/png'
        });
        formData.append('day', '1');
        formData.append('title', 'Test Upload Image');
        formData.append('category', 'test');
        formData.append('tags', 'test, api');

        console.log('📤 Sending test upload...');
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Upload successful!');
            console.log('📋 Result:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ Upload failed:');
            console.log('🔍 Error:', result);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUpload();
