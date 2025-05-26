# 🏞️ WEENLAND Photo Gallery

A modern, enterprise-grade photo gallery application built with Next.js 15, TypeScript, and Google Cloud Storage. Features advanced image management, real-time processing, and comprehensive admin controls with full Thai language support.

## ✨ Key Features

### 📸 **Cloud-Native Storage**
- Real Google Cloud Storage integration with automatic scaling
- Intelligent image compression and optimization
- CDN-powered global delivery
- Automatic backup and redundancy

### 🖼️ **Advanced Image Management**
- Smart thumbnail generation with multiple quality settings
- Batch upload with progress tracking
- Real-time image processing and optimization
- Metadata extraction and management

### 🔍 **Powerful Search & Discovery**
- Full-text search across titles, tags, and metadata
- Advanced filtering by category, date, and custom attributes
- Smart tagging and auto-categorization
- Favorites system with personal collections

### ⚡ **Performance & UX**
- Infinite scroll with virtual rendering
- Progressive image loading with blur-up effect
- Responsive grid layout (1-4 columns)
- Keyboard navigation and accessibility support

### 🛡️ **Security & Admin**
- JWT-based authentication system
- Role-based access control
- Secure admin panel with batch operations
- Comprehensive audit logging

### 🌍 **Internationalization**
- Full Thai language support
- Localized date and number formatting
- Cultural-specific UI adaptations

## 🚀 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript** - Type-safe development with strict mode
- **Tailwind CSS** - Utility-first styling with custom design system
- **Lucide React** - Consistent icon library

### Backend & Storage
- **Google Cloud Storage** - Scalable object storage with global CDN
- **Sharp** - High-performance image processing
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing and security

### Build & Development
- **Turbopack** - Ultra-fast development builds
- **ESLint** - Code quality and consistency
- **PostCSS** - Advanced CSS processing

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** with npm or yarn
- **Google Cloud Account** with billing enabled
- **Modern browser** with ES2020+ support

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Create credentials directory
mkdir -p credentials
```

### 3. Google Cloud Configuration

#### Option A: Automated Setup (Recommended)
```bash
npm run setup:gcs
```

#### Option B: Manual Setup
1. Create Google Cloud project
2. Enable Cloud Storage API
3. Create storage bucket
4. Generate service account credentials
5. Configure environment variables

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your gallery!

## 📋 Available Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing & Utilities
```bash
npm run test:connection  # Test Google Cloud connection
npm run test:auth       # Test authentication system
npm run test:upload     # Test upload functionality
npm run sync:images     # Sync images from cloud storage
npm run generate:hash   # Generate password hashes
```

### Setup & Configuration
```bash
npm run setup:gcs       # Automated Google Cloud setup
```

## 💡 Usage Guide

### 👨‍💼 Admin Operations

#### Uploading Images
1. Click the **"Admin"** button (floating button, bottom-right)
2. Authenticate with admin credentials
3. Use drag-and-drop or click to select images
4. Configure compression settings (optional)
5. Choose display day/category
6. Click **"อัปโหลดรูปภาพ"** (Upload Images)

#### Managing Images
- **Batch Select**: Use checkboxes to select multiple images
- **Delete Images**: Select and click delete (admin only)
- **Update Metadata**: Edit titles, tags, and categories
- **Download ZIP**: Select images and download as compressed archive

#### Cloud Synchronization
- Click **"ซิงค์รูปภาพจาก Cloud Storage"** to load new images
- Automatic sync runs periodically for new uploads

### 👤 User Experience

#### Browsing Gallery
- **Grid View**: Responsive layout adapts to screen size
- **Infinite Scroll**: Images load automatically as you scroll
- **Search**: Use the search bar for titles, tags, or metadata
- **Filter**: Select categories from the dropdown filter

#### Image Viewing
- **Lightbox**: Click any image for full-screen viewing
- **Navigation**: Use arrow keys or click navigation buttons
- **Zoom**: Double-click or pinch to zoom (mobile)
- **Keyboard**: `Esc` to close, arrow keys to navigate

#### Downloading
- **Single Image**: Click download button on any image card
- **Batch Download**: Select multiple images and download as ZIP
- **High Quality**: Downloads original resolution images

### 🔧 Configuration

#### Environment Variables
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-service-account.json
NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/your-bucket-name

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secret-key

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$... # Use npm run generate:hash
```

#### Image Processing Settings
Customize in `src/constants/config.ts`:
```typescript
export const IMAGE_CONFIG = {
  THUMBNAIL_SIZE: 300,           // Thumbnail dimensions
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB upload limit
  QUALITY: {
    THUMBNAIL: 80,               // Thumbnail quality (1-100)
    FULL_SIZE: 90,              // Full-size quality (1-100)
  },
};
```

#### Gallery Display Settings
```typescript
export const GALLERY_CONFIG = {
  ITEMS_PER_PAGE: 20,           // Images per page
  GRID_BREAKPOINTS: {
    SM: 1,                      // Mobile: 1 column
    MD: 2,                      // Tablet: 2 columns
    LG: 3,                      // Desktop: 3 columns
    XL: 4,                      // Large: 4 columns
  },
};
```

## 📁 Project Structure

```
weenland-photo-gallery/
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tailwind.config.ts       # Tailwind CSS setup
│   ├── next.config.ts           # Next.js configuration
│   └── eslint.config.mjs        # ESLint rules
│
├── 🔑 Environment & Credentials
│   ├── .env                     # Environment variables
│   └── credentials/             # Google Cloud service account
│       └── gcp-service-account.json
│
├── 📚 Documentation
│   ├── README.md               # Main documentation (this file)
│   ├── docs/
│   │   ├── guides/            # Setup and integration guides
│   │   │   ├── GOOGLE_CLOUD_INTEGRATION.md
│   │   │   ├── GOOGLE_CLOUD_THAI_GUIDE.md
│   │   │   ├── SETUP_INSTRUCTIONS.md
│   │   │   └── IMPLEMENTATION_SUMMARY.md
│   │   └── improvements-list.md
│   └── scripts/README.md      # Scripts documentation
│
├── 🛠️ Scripts & Utilities
│   ├── scripts/
│   │   ├── setup-gcs.sh        # Automated GCS setup
│   │   ├── test-*.js          # Testing utilities
│   │   ├── sync-images.js     # Image synchronization
│   │   └── configure-bucket.js # Bucket configuration
│   └── utils/                 # General utilities
│
├── 🎨 Frontend Application
│   ├── public/                # Static assets
│   │   ├── icons/            # SVG icons
│   │   └── data/             # Sample data
│   └── src/
│       ├── app/              # Next.js App Router
│       │   ├── layout.tsx    # Root layout
│       │   ├── page.tsx      # Main gallery page
│       │   ├── globals.css   # Global styles
│       │   └── api/          # API routes
│       │       ├── auth/     # Authentication endpoints
│       │       ├── images/   # Image management
│       │       ├── upload/   # File upload handling
│       │       └── sync/     # Cloud synchronization
│       │
│       ├── components/       # React components
│       │   ├── GalleryCard.tsx      # Image display card
│       │   ├── Lightbox.tsx         # Modal image viewer
│       │   ├── AdminNavBar.tsx      # Admin navigation
│       │   ├── FeatureBar.tsx       # Search and filters
│       │   └── archive/             # Legacy components
│       │
│       ├── hooks/           # Custom React hooks
│       │   └── useInfiniteScroll.ts # Infinite scroll logic
│       │
│       ├── lib/             # Core business logic
│       │   ├── storage.ts   # Google Cloud Storage
│       │   ├── auth.ts      # Authentication
│       │   ├── image-compressor.ts # Image processing
│       │   └── file-manager.ts     # File operations
│       │
│       ├── types/           # TypeScript definitions
│       │   ├── index.ts     # Main type definitions
│       │   └── global.d.ts  # Global type augmentations
│       │
│       ├── constants/       # Application constants
│       │   └── config.ts    # Configuration values
│       │
│       └── utils/           # Utility functions
│           └── helpers.ts   # Common helper functions
│
└── 🗂️ Data & Generated
    ├── .next/              # Next.js build output
    └── node_modules/       # Dependencies
```

### 📁 Directory Explanations

#### `/src/app/` - Next.js Application
- **App Router structure** with file-based routing
- **API routes** for backend functionality
- **Layout and page components** for the UI structure

#### `/src/components/` - React Components
- **Modular components** for reusability
- **Archive folder** for legacy/unused components
- **Feature-specific components** (admin, gallery, etc.)

#### `/src/lib/` - Core Business Logic
- **Storage management** with Google Cloud integration
- **Authentication system** with JWT
- **Image processing** and optimization
- **File management** utilities

#### `/src/hooks/` - Custom React Hooks
- **Reusable logic** extracted into hooks
- **Performance optimizations** for common patterns

#### `/scripts/` - Development & Deployment Tools
- **Setup automation** for Google Cloud
- **Testing utilities** for various components
- **Maintenance scripts** for data management

#### `/docs/` - Documentation
- **Setup guides** in multiple languages
- **Technical documentation** for integrations
- **Implementation notes** and best practices

## 🔧 Advanced Configuration

### Custom Styling

#### Theme Customization
The app uses a custom design system defined in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      'plum-purple': '#A849C5',    // Primary accent color
      'honey-yellow': '#E3A857',   // Secondary accent color
    },
    fontFamily: {
      'sans': ['Inter', 'sans-serif'],
    },
  },
}
```

#### Global Styles
- **Main styles**: `src/app/globals.css`
- **Safari fixes**: `src/app/safari-fixes.css`
- **Component styles**: Tailwind utility classes

#### Responsive Breakpoints
```css
/* Mobile-first responsive design */
sm: '640px',   /* Small devices */
md: '768px',   /* Medium devices */
lg: '1024px',  /* Large devices */
xl: '1280px',  /* Extra large devices */
2xl: '1536px', /* 2X large devices */
```

### Performance Optimization

#### Image Processing
- **Automatic compression** with Sharp
- **WebP format support** for modern browsers
- **Progressive JPEG** for faster loading
- **Thumbnail generation** for grid views

#### Frontend Performance
- **Infinite scroll** with virtual rendering
- **Image lazy loading** with blur-up effect
- **Component code splitting** with dynamic imports
- **Service Worker** for offline capabilities (future)

#### Backend Optimization
- **Google Cloud CDN** for global delivery
- **Compression middleware** for API responses
- **Database query optimization** for metadata
- **Caching strategies** for frequent requests

### Security Features

#### Authentication
- **JWT tokens** with secure secrets
- **Bcrypt password hashing** with salt rounds
- **Session management** with secure cookies
- **Rate limiting** on API endpoints

#### File Upload Security
- **File type validation** on client and server
- **File size limits** to prevent abuse
- **Malware scanning** integration ready
- **Content Security Policy** headers

#### Google Cloud Security
- **IAM roles and permissions** properly configured
- **Service account** with minimal required permissions
- **Bucket policies** for public read access only
- **CORS configuration** for secure cross-origin requests

## 📚 Documentation

### Setup Guides
- **[Thai Setup Guide](./docs/guides/GOOGLE_CLOUD_THAI_GUIDE.md)** - ภาษาไทย
- **[English Setup Guide](./docs/guides/SETUP_INSTRUCTIONS.md)** - English
- **[Integration Guide](./docs/guides/GOOGLE_CLOUD_INTEGRATION.md)** - Technical details

### API Documentation
- **Authentication API** - JWT-based auth system
- **Image Management API** - CRUD operations for images
- **Upload API** - Multi-part file upload handling
- **Sync API** - Cloud storage synchronization

### Component Documentation
- **Gallery Components** - Main display components
- **Admin Components** - Administrative interface
- **Utility Hooks** - Custom React hooks
- **Type Definitions** - TypeScript interfaces

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Setup

#### Production Environment Variables
```bash
# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Google Cloud (same as development)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
# ... other GCS settings

# Security (generate new values)
JWT_SECRET=your-production-secret
ADMIN_PASSWORD_HASH=your-production-hash
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Google Cloud Run
```bash
# Build container
docker build -t weenland-gallery .

# Deploy to Cloud Run
gcloud run deploy weenland-gallery \
  --image gcr.io/PROJECT-ID/weenland-gallery \
  --platform managed \
  --region us-central1
```

#### Traditional Hosting
```bash
# Build static export (if needed)
npm run build
npm run export

# Upload dist/ folder to your hosting provider
```

## 🔍 Troubleshooting

### Common Issues

#### Google Cloud Storage Connection
```bash
# Test connection
npm run test:connection

# Check credentials file
ls -la credentials/gcp-service-account.json

# Verify environment variables
npm run test:env
```

#### Upload Issues
```bash
# Test upload functionality
npm run test:upload

# Check file permissions
chmod +x scripts/setup-gcs.sh

# Verify bucket configuration
node scripts/check-bucket.js
```

#### Authentication Problems
```bash
# Test auth system
npm run test:auth

# Generate new password hash
npm run generate:hash

# Check JWT secret configuration
echo $JWT_SECRET
```

### Performance Issues

#### Slow Image Loading
- Check Google Cloud CDN configuration
- Verify image compression settings
- Test network connectivity to storage bucket

#### High Memory Usage
- Reduce `ITEMS_PER_PAGE` in configuration
- Enable virtual rendering for large galleries
- Check for memory leaks in browser dev tools

### Development Issues

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
npm update @types/node @types/react
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment: `cp .env.example .env`
5. Start development: `npm run dev`

### Code Style
- **TypeScript** for all new code
- **ESLint** configuration must pass
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Testing
```bash
# Run all tests
npm run test:connection
npm run test:auth
npm run test:upload

# Manual testing checklist
- [ ] Image upload works
- [ ] Gallery displays correctly
- [ ] Search and filters function
- [ ] Admin panel accessible
- [ ] Download functionality works
```

### Pull Request Process
1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all existing tests pass
4. Update README.md if needed
5. Submit pull request with clear description

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js team** for the amazing framework
- **Google Cloud** for reliable storage infrastructure
- **Tailwind CSS** for the utility-first CSS framework
- **Sharp** for high-performance image processing
- **Open source community** for inspiration and tools

## 📞 Support

### Getting Help
- **GitHub Issues** - Report bugs and request features
- **Documentation** - Check the docs/ directory
- **Community** - Join discussions in GitHub Discussions

### Commercial Support
For commercial support, custom development, or enterprise features, please contact the development team.

---

**Built with ❤️ by the WEENLAND team**

*Making photo galleries beautiful, fast, and accessible for everyone.*
