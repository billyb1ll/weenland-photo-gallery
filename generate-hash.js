#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'weenland2024';
    const saltRounds = 10;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash:', hash);

        // Test the hash
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash validation:', isValid);

        // Test against current hash in .env
        const envHash = '$2a$10$8K1p/a0drtIzAO0M5lY8..YzPOEW6KQQvY45LbHy8S8VE2XKVdM9K';
        const isEnvValid = await bcrypt.compare(password, envHash);
        console.log('Env hash validation:', isEnvValid);

    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();
