# Scripts Directory

This directory contains utility scripts and tools for the Weenland Photo Gallery project.

## Setup Scripts

- `setup-gcs.sh` - Automated Google Cloud Storage setup script
- `configure-bucket.js` - Configure Google Cloud Storage bucket settings
- `check-bucket.js` - Check bucket configuration and permissions

## Test Scripts

- `test-gcs-connection.js` - Test Google Cloud Storage connection
- `test-auth.js` - Test authentication functionality
- `test-upload.js` - Test image upload functionality
- `test-download.js` - Test image download functionality
- `test-env.js` - Test environment variables
- `test-imports.js` - Test module imports

## Utility Scripts

- `sync-images.js` - Sync images between local and cloud storage
- `generate-hash.js` - Generate password hashes for admin accounts

## Usage

Run scripts from the project root directory:

```bash
# Setup Google Cloud Storage
./scripts/setup-gcs.sh

# Test connection
node scripts/test-gcs-connection.js

# Sync images
node scripts/sync-images.js
```

All scripts should be run from the project root directory to ensure proper path resolution and environment variable loading.
