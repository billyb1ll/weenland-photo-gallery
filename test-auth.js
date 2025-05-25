#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

async function testAuth() {
    console.log('🔐 Testing Authentication System...\n');

    try {
        // Test 1: Login with correct credentials
        console.log('1. Testing login with correct credentials...');
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'weenland2024'
            }),
        });

        const loginResult = await loginResponse.json();

        if (loginResponse.ok && loginResult.success) {
            console.log('✅ Login successful!');
            console.log('👤 User:', loginResult.user);
            console.log('🎫 Token received:', loginResult.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Login failed:', loginResult.error);
            return;
        }

        // Get cookie from response
        const cookies = loginResponse.headers.get('set-cookie');
        const authCookie = cookies ? cookies.split(';')[0] : '';

        // Test 2: Verify authentication
        console.log('\n2. Testing auth verification...');
        const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
            headers: {
                'Cookie': authCookie,
            },
        });

        const verifyResult = await verifyResponse.json();

        if (verifyResult.authenticated) {
            console.log('✅ Auth verification successful!');
            console.log('👤 Verified user:', verifyResult.user);
        } else {
            console.log('❌ Auth verification failed');
        }

        // Test 3: Test upload with authentication
        console.log('\n3. Testing authenticated upload...');

        // Create a simple test file buffer
        const testImageBuffer = Buffer.from('fake-image-data');
        const FormData = require('form-data');
        const formData = new FormData();

        formData.append('file', testImageBuffer, {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg'
        });
        formData.append('day', '1');

        const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            headers: {
                'Cookie': authCookie,
            },
            body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResponse.ok) {
            console.log('✅ Authenticated upload successful!');
        } else {
            console.log('❌ Upload failed:', uploadResult.error);
        }

        // Test 4: Test logout
        console.log('\n4. Testing logout...');
        const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Cookie': authCookie,
            },
        });

        const logoutResult = await logoutResponse.json();

        if (logoutResponse.ok) {
            console.log('✅ Logout successful!');
        } else {
            console.log('❌ Logout failed:', logoutResult.error);
        }

        // Test 5: Verify logged out
        console.log('\n5. Testing post-logout verification...');
        const postLogoutVerifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
            headers: {
                'Cookie': authCookie,
            },
        });

        const postLogoutVerifyResult = await postLogoutVerifyResponse.json();

        if (!postLogoutVerifyResult.authenticated) {
            console.log('✅ Post-logout verification successful - user is logged out');
        } else {
            console.log('❌ User still appears to be logged in after logout');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test wrong credentials
async function testWrongCredentials() {
    console.log('\n🔒 Testing wrong credentials...');

    try {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'wrongpassword'
            }),
        });

        const result = await response.json();

        if (!response.ok && result.error) {
            console.log('✅ Wrong credentials properly rejected:', result.error);
        } else {
            console.log('❌ Wrong credentials were accepted - security issue!');
        }
    } catch (error) {
        console.error('❌ Wrong credentials test failed:', error.message);
    }
}

async function runAllTests() {
    await testAuth();
    await testWrongCredentials();
    console.log('\n🎯 Authentication tests completed!');
}

if (require.main === module) {
    runAllTests();
}

module.exports = { testAuth, testWrongCredentials };
