#!/usr/bin/env node

// Google Cloud Storage Connection Test
// สคริปต์ทดสอบการเชื่อมต่อ Google Cloud Storage

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

console.log('🔧 Google Cloud Storage Connection Test');
console.log('==========================================');

// Load environment variables
require('dotenv').config();

async function testConnection() {
    try {
        // Check environment variables
        console.log('\n📋 ตรวจสอบ Environment Variables:');

        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (!projectId) {
            console.log('❌ GOOGLE_CLOUD_PROJECT_ID is missing');
            return false;
        }
        console.log(`✅ Project ID: ${projectId}`);

        if (!bucketName) {
            console.log('❌ GOOGLE_CLOUD_BUCKET_NAME is missing');
            return false;
        }
        console.log(`✅ Bucket Name: ${bucketName}`);

        // Check credentials
        let storage;
        if (credentialsJson) {
            console.log('✅ Using JSON credentials from environment variable');
            const credentials = JSON.parse(credentialsJson);
            storage = new Storage({
                projectId,
                credentials,
            });
        } else if (credentialsPath) {
            console.log(`✅ Using credentials file: ${credentialsPath}`);

            // Check if file exists
            if (!fs.existsSync(credentialsPath)) {
                console.log(`❌ Credentials file not found: ${credentialsPath}`);
                console.log('💡 ตรวจสอบว่าไฟล์ JSON อยู่ในตำแหน่งที่ถูกต้อง');
                return false;
            }

            storage = new Storage({
                projectId,
                keyFilename: credentialsPath,
            });
        } else {
            console.log('❌ No credentials found');
            console.log('💡 ตั้งค่า GOOGLE_APPLICATION_CREDENTIALS หรือ GOOGLE_APPLICATION_CREDENTIALS_JSON');
            return false;
        }

        // Test bucket access
        console.log('\n🪣 ทดสอบการเข้าถึง Bucket:');
        const bucket = storage.bucket(bucketName);

        // Check if bucket exists
        const [exists] = await bucket.exists();
        if (!exists) {
            console.log(`❌ Bucket '${bucketName}' does not exist`);
            console.log('💡 ตรวจสอบชื่อ bucket ใน Google Cloud Console');
            return false;
        }
        console.log(`✅ Bucket '${bucketName}' exists`);

        // Test bucket metadata
        try {
            const [metadata] = await bucket.getMetadata();
            console.log(`✅ Bucket location: ${metadata.location}`);
            console.log(`✅ Storage class: ${metadata.storageClass}`);
        } catch (error) {
            console.log('⚠️ Could not get bucket metadata (but bucket exists)');
        }

        // Test listing files
        console.log('\n📁 ทดสอบการ list ไฟล์:');
        try {
            const [files] = await bucket.getFiles({ maxResults: 5 });
            console.log(`✅ Found ${files.length} files in bucket`);

            if (files.length > 0) {
                console.log('📄 Sample files:');
                files.slice(0, 3).forEach(file => {
                    console.log(`   - ${file.name}`);
                });
            } else {
                console.log('📄 Bucket is empty (this is normal for a new bucket)');
            }
        } catch (error) {
            console.log(`❌ Failed to list files: ${error.message}`);
            return false;
        }

        // Test write permissions (create a test file)
        console.log('\n✍️ ทดสอบการเขียนไฟล์:');
        try {
            const testFileName = `test/connection-test-${Date.now()}.txt`;
            const testContent = 'This is a test file created by Weenland Photo Gallery setup';

            const file = bucket.file(testFileName);
            await file.save(testContent);
            console.log(`✅ Successfully created test file: ${testFileName}`);

            // Clean up test file
            await file.delete();
            console.log('✅ Successfully deleted test file');

        } catch (error) {
            console.log(`❌ Failed to create test file: ${error.message}`);
            console.log('💡 ตรวจสอบสิทธิ์ของ Service Account (ต้องเป็น Storage Admin)');
            return false;
        }

        console.log('\n🎉 การทดสอบสำเร็จ! Google Cloud Storage พร้อมใช้งาน');
        console.log('✨ คุณสามารถรัน npm run dev เพื่อเริ่มใช้งานได้แล้ว');

        return true;

    } catch (error) {
        console.log(`\n❌ การทดสอบล้มเหลว: ${error.message}`);

        // Common error suggestions
        if (error.message.includes('Invalid Credentials')) {
            console.log('💡 ปัญหาการตรวจสอบสิทธิ์:');
            console.log('   - ตรวจสอบไฟล์ Service Account JSON');
            console.log('   - ตรวจสอบ GOOGLE_APPLICATION_CREDENTIALS ในไฟล์ .env');
        } else if (error.message.includes('Not Found')) {
            console.log('💡 ไม่พบ Bucket:');
            console.log('   - ตรวจสอบชื่อ bucket ใน GOOGLE_CLOUD_BUCKET_NAME');
            console.log('   - ตรวจสอบว่า bucket มีอยู่จริงใน Google Cloud Console');
        } else if (error.message.includes('Permission')) {
            console.log('💡 ปัญหาสิทธิ์:');
            console.log('   - ตรวจสอบ Role ของ Service Account (ต้องเป็น Storage Admin)');
            console.log('   - ตรวจสอบว่า Service Account สามารถเข้าถึง bucket ได้');
        }

        return false;
    }
}

// Run the test
testConnection().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
