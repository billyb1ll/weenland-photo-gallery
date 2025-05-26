#!/usr/bin/env node

require('dotenv').config();
const bcrypt = require('bcryptjs');

async function testEnvAndAuth() {
    console.log('🔍 Environment Variable Check:');
    console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);

    console.log('\n🔐 Testing Password Hash:');
    const password = 'weenland2024';
    const envHash = process.env.ADMIN_PASSWORD_HASH;

    if (envHash) {
        const isValid = await bcrypt.compare(password, envHash);
        console.log('Password validation result:', isValid);

        if (!isValid) {
            console.log('\n🔧 Generating new hash:');
            const newHash = await bcrypt.hash(password, 10);
            console.log('New hash:', newHash);

            // Test the new hash
            const newHashValid = await bcrypt.compare(password, newHash);
            console.log('New hash validation:', newHashValid);
        }
    } else {
        console.log('❌ No ADMIN_PASSWORD_HASH found in environment');
    }
}

testEnvAndAuth();
