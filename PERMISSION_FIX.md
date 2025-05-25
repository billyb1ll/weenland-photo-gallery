## Google Cloud Permission Fix Guide

### Quick Fix - Method 1: Update Service Account Roles

1. **Go to IAM & Admin > IAM**
   - Visit: https://console.cloud.google.com/iam-admin/iam?project=nifty-linker-455911-k6
   
2. **Find your service account**: `weenland-gallery-service@nifty-linker-455911-k6.iam.gserviceaccount.com`

3. **Click the pencil icon (Edit) next to it**

4. **Remove existing roles and add these roles:**
   - ✅ `Storage Admin` (storage.admin)
   - ✅ `Storage Object Admin` (storage.objectAdmin)
   - ✅ `Storage Object Creator` (storage.objectCreator)
   - ✅ `Storage Object Viewer` (storage.objectViewer)

5. **Click "Save"**

### Alternative Fix - Method 2: Bucket-Level Permissions

1. **Go to Cloud Storage**
   - Visit: https://console.cloud.google.com/storage/browser/weenland-gallery-images-2025?project=nifty-linker-455911-k6

2. **Click on your bucket name**: `weenland-gallery-images-2025`

3. **Go to "Permissions" tab**

4. **Click "Grant Access"**

5. **Add these permissions:**
   - Principal: `weenland-gallery-service@nifty-linker-455911-k6.iam.gserviceaccount.com`
   - Role: `Storage Admin`
   - Click "Save"

6. **Add public access for images:**
   - Principal: `allUsers`
   - Role: `Storage Object Viewer`
   - Click "Save"

### Test After Fix:
Run this command to test: `node test-gcs-connection.js`
