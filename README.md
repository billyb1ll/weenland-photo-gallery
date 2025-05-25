# 🏞️ WEENLAND Photo Gallery

A modern, feature-rich photo gallery built with Next.js, TypeScript, and Tailwind CSS. Now featuring **real Google Cloud Storage integration** for uploading, managing, and downloading photos with Thai language support.

## ✨ Features

- 📸 **Real Google Cloud Storage Integration** - Upload and manage photos in the cloud
- 🖼️ **Automatic Image Processing** - Creates thumbnails and optimized full-size images
- 📱 **Responsive Gallery Grid** - Adapts from 1 to 4 columns based on screen size
- 🔍 **Search & Filter** - Live search by title/tags and category filtering
- ❤️ **Favorites System** - Mark images as favorites and toggle view
- ✅ **Multi-Select & Batch Download** - Select multiple images and download as ZIP
- 📦 **Cloud-Based Downloads** - Download images directly from Google Cloud Storage
- 🖼️ **Lightbox Modal** - Full-screen image viewing with navigation
- 🌍 **Thai Language Support** - Full Thai interface and documentation
- ♿ **Accessibility** - Keyboard navigation, focus management, and screen reader support
- ⚡ **Infinite Scroll** - Load images progressively for better performance
- 🎨 **Custom Theme** - Beautiful diagonal gradient background
- 🔧 **Admin Panel** - Easy management interface for uploads and sync

## 🚀 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Google Cloud Storage** - Cloud storage for images
- **Sharp** - High-performance image processing
- **Lucide React** - Beautiful icons
- **JSZip** - ZIP file creation for batch downloads
- **File-Saver** - File download utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Account (for cloud storage features)

### 🚀 Quick Setup with Google Cloud Storage

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Automated Google Cloud Setup

Run the setup script for easy configuration:

```bash
./setup-gcs.sh
```

#### 3. Manual Google Cloud Setup (Alternative)

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project named `weenland-photo-gallery`
   - Enable Cloud Storage API

2. **Create Storage Bucket**
   - Create a bucket with a unique name (e.g., `weenland-photos-abc123`)
   - Set location to `asia-southeast1` (Singapore)
   - Make bucket publicly readable for images

3. **Create Service Account**
   - Create service account: `weenland-storage-service`
   - Add roles: `Storage Admin` and `Storage Object Admin`
   - Download JSON key file

#### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Create credentials directory
mkdir credentials

# Place your service account JSON file
mv path/to/your-service-account.json credentials/gcp-service-account.json
```

Edit `.env` with your Google Cloud details:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-service-account.json
NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/your-bucket-name
```

#### 5. Test Connection

```bash
node test-gcs-connection.js
```

#### 6. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` and click "Admin" to start uploading!

### 📚 Complete Documentation

- **[Thai Setup Guide](./GOOGLE_CLOUD_THAI_GUIDE.md)** - Comprehensive Thai guide
- **[Integration Details](./GOOGLE_CLOUD_INTEGRATION.md)** - Technical documentation

### 🎯 How to Use

#### Upload Photos
1. Click "Admin" button (bottom right corner)
2. Select image files to upload  
3. Choose the day for display
4. Click "อัปโหลดรูปภาพ" (Upload Images)

#### Download Photos  
1. Click on photos to select them (checkbox appears)
2. Click "ดาวน์โหลดรูปที่เลือก" (Download Selected)
3. Get ZIP file with all selected images

#### Sync from Cloud
- Click "ซิงค์รูปภาพจาก Cloud Storage" to load new images

## 📦 Installation (Traditional)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd weenland-photo-gallery
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main gallery page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles with custom colors
│   └── api/
│       └── download-batch/   # API route for ZIP downloads
├── components/
│   ├── GalleryCard.tsx       # Individual image card component
│   ├── Lightbox.tsx          # Modal image viewer
│   └── FeatureBar.tsx        # Search, filter, and action toolbar
└── data/
    └── images.json           # Sample image data
```

## Customization

### Colors

The app uses custom Tailwind colors defined in `tailwind.config.ts`:
- `plum-purple`: #A849C5
- `honey-yellow`: #E3A857

### Image Data

Modify `src/data/images.json` to use your own images. Each image object should have:

```json
{
  "id": 1,
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "fullUrl": "https://example.com/full.jpg", 
  "title": "Image Title",
  "category": "Category Name",
  "tags": ["tag1", "tag2"]
}
```

### Styling

- Global styles: `src/app/globals.css`
- Component styles: Tailwind classes in individual components
- Theme customization: `tailwind.config.ts`

## Key Features Explained

### Search & Filter
- **Text Search**: Searches image titles and tags
- **Category Filter**: Dropdown to filter by image category
- **Favorites Toggle**: Show only favorited images

### Multi-Select & Download
- **Individual Download**: Download single images via card button
- **Batch Selection**: Use checkboxes to select multiple images
- **ZIP Download**: Download selected images as a ZIP file

### Lightbox
- **Keyboard Navigation**: Arrow keys to navigate, Escape to close
- **Touch/Mouse Support**: Click outside to close, navigation buttons
- **Accessibility**: Focus management and screen reader support

### Infinite Scroll
- **Progressive Loading**: Loads 20 images at a time
- **Performance**: Reduces initial load time
- **Smooth Experience**: Automatic loading as user scrolls

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues or questions, please open an issue on the repository.
