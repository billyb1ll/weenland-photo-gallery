# Google Cloud Storage Integration Guide for Weenland Photo Gallery

This guide will help you integrate Google Cloud Storage with your Weenland Photo Gallery to enable image uploads, storage, and management.

## Prerequisites

1. Google Cloud Platform account
2. Node.js project (already set up)
3. Basic understanding of React and Next.js

## Step 1: Set up Google Cloud Storage

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your PROJECT_ID

### 1.2 Enable Google Cloud Storage API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Cloud Storage API"
3. Click "Enable"

### 1.3 Create a Storage Bucket
1. Go to "Storage" > "Buckets"
2. Click "Create Bucket"
3. Choose a unique bucket name (e.g., `weenland-gallery-images`)
4. Select region closest to your users
5. Choose "Standard" storage class
6. Set permissions to "Fine-grained" for better control

### 1.4 Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it `weenland-gallery-service`
4. Add roles:
   - Storage Object Admin
   - Storage Object Creator
   - Storage Object Viewer
5. Create and download JSON key file
6. Store the key file securely (DO NOT commit to Git)

## Step 2: Install Dependencies

```bash
npm install @google-cloud/storage multer sharp
npm install --save-dev @types/multer
```

## Step 3: Environment Variables

Create a `.env.local` file in your project root:

```env
# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=weenland-gallery-images
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/service-account-key.json

# Optional: CDN URL if using Google Cloud CDN
GOOGLE_CLOUD_CDN_URL=https://your-cdn-url.com
```

## Step 4: Create Storage Utility

Create `src/lib/storage.ts`:

```typescript
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!);

export interface UploadResult {
  thumbnailUrl: string;
  fullUrl: string;
  fileName: string;
}

export async function uploadImageToGCS(
  file: Buffer,
  fileName: string,
  day: number
): Promise<UploadResult> {
  try {
    // Generate optimized versions
    const thumbnail = await sharp(file)
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fullSize = await sharp(file)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload paths
    const thumbPath = `day-${day}/thumbnails/${fileName}`;
    const fullPath = `day-${day}/full/${fileName}`;

    // Upload thumbnail
    const thumbFile = bucket.file(thumbPath);
    await thumbFile.save(thumbnail, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    // Upload full image
    const fullFile = bucket.file(fullPath);
    await fullFile.save(fullSize, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    // Make files public
    await thumbFile.makePublic();
    await fullFile.makePublic();

    // Generate URLs
    const baseUrl = process.env.GOOGLE_CLOUD_CDN_URL || 
                   `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}`;

    return {
      thumbnailUrl: `${baseUrl}/${thumbPath}`,
      fullUrl: `${baseUrl}/${fullPath}`,
      fileName,
    };
  } catch (error) {
    console.error('Error uploading to Google Cloud Storage:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteImageFromGCS(fileName: string, day: number): Promise<void> {
  try {
    const thumbPath = `day-${day}/thumbnails/${fileName}`;
    const fullPath = `day-${day}/full/${fileName}`;

    await Promise.all([
      bucket.file(thumbPath).delete(),
      bucket.file(fullPath).delete(),
    ]);
  } catch (error) {
    console.error('Error deleting from Google Cloud Storage:', error);
    throw new Error('Failed to delete image');
  }
}
```

## Step 5: Create Upload API Route

Create `src/app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToGCS } from '@/lib/storage';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const day = parseInt(formData.get('day') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!day || day < 1) {
      return NextResponse.json({ error: 'Invalid day provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name) || '.jpg';
    const fileName = `image-${timestamp}${extension}`;

    // Upload to Google Cloud Storage
    const uploadResult = await uploadImageToGCS(buffer, fileName, day);

    // Update your images.json file here
    // You might want to implement a database instead for production
    const imagesPath = path.join(process.cwd(), 'src/data/images.json');
    const imagesData = JSON.parse(await fs.readFile(imagesPath, 'utf8'));
    
    const newImage = {
      id: Date.now(),
      thumbnailUrl: uploadResult.thumbnailUrl,
      fullUrl: uploadResult.fullUrl,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      category: 'uploaded',
      tags: [`day-${day}`],
      day,
      uploadDate: new Date().toISOString(),
    };

    imagesData.push(newImage);
    await fs.writeFile(imagesPath, JSON.stringify(imagesData, null, 2));

    return NextResponse.json({
      success: true,
      image: newImage,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
```

## Step 6: Update Admin Upload Function

Update the `handleImageUpload` function in `src/app/page.tsx`:

```typescript
const handleImageUpload = async (file: File, day: number) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('day', day.toString());

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      // Add the new image to the local state
      setImages(prev => [...prev, result.image]);
      alert('Image uploaded successfully!');
    } else {
      const error = await response.json();
      alert(`Upload failed: ${error.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
  }
};
```

## Step 7: Security Considerations

### 7.1 Bucket Permissions
- Set up CORS for your bucket if needed:
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

### 7.2 File Validation
Add file type and size validation in your upload API:

```typescript
// In your upload API route
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 });
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}
```

### 7.3 Authentication
Ensure only authenticated admin users can upload:

```typescript
// Add to your upload API route
const isAuthenticated = // Check your auth logic here
if (!isAuthenticated) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Step 8: Optional Enhancements

### 8.1 Image Metadata
Store additional metadata like EXIF data:

```typescript
import ExifReader from 'exifreader';

const tags = ExifReader.load(buffer);
// Extract relevant metadata
```

### 8.2 Progressive Upload
Implement upload progress tracking:

```typescript
// Use XMLHttpRequest for progress tracking
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    setUploadProgress(percentComplete);
  }
});
```

### 8.3 CDN Integration
Set up Google Cloud CDN for faster image delivery:
1. Go to "Network Services" > "Cloud CDN"
2. Create origin for your storage bucket
3. Configure caching rules
4. Update your environment variables with CDN URL

## Step 9: Monitoring and Costs

### 9.1 Set up Billing Alerts
1. Go to "Billing" > "Budgets & alerts"
2. Set up budget alerts for storage costs
3. Monitor usage regularly

### 9.2 Storage Cost Optimization
- Use lifecycle policies to move old images to cheaper storage classes
- Implement image compression and WebP format for better performance
- Consider using Cloud CDN for global distribution

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account key path
   - Check environment variables
   - Ensure proper IAM roles

2. **Upload Failures**
   - Check file permissions
   - Verify bucket configuration
   - Monitor quota limits

3. **CORS Issues**
   - Configure bucket CORS settings
   - Check domain whitelisting

### Useful Commands

```bash
# Test Google Cloud authentication
gcloud auth list

# Set project
gcloud config set project YOUR_PROJECT_ID

# List buckets
gsutil ls

# Copy files to bucket
gsutil cp -r ./images gs://your-bucket-name/
```

## Production Deployment

1. **Secure Environment Variables**
   - Use Vercel/Netlify environment variables
   - Never commit service account keys

2. **Database Migration**
   - Consider moving from JSON to PostgreSQL/MongoDB
   - Implement proper data persistence

3. **Backup Strategy**
   - Set up automated backups
   - Test recovery procedures

4. **Performance Monitoring**
   - Implement error tracking
   - Monitor upload/download speeds
   - Set up alerting for failures

## Support

For additional help:
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Sharp Image Processing Documentation](https://sharp.pixelplumbing.com/)

---

This integration will provide a robust, scalable solution for managing images in your Weenland Photo Gallery with Google Cloud Storage's enterprise-grade infrastructure.
