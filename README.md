# WEENLAND Photo Gallery

A modern, feature-rich photo gallery built with Next.js, TypeScript, and Tailwind CSS. Features a beautiful gradient theme with plum-purple and honey-yellow colors.

## Features

- 📸 **Responsive Gallery Grid**: Adapts from 1 to 4 columns based on screen size
- 🔍 **Search & Filter**: Live search by title/tags and category filtering
- ❤️ **Favorites System**: Mark images as favorites and toggle view
- ✅ **Multi-Select & Batch Download**: Select multiple images and download as ZIP
- 🖼️ **Lightbox Modal**: Full-screen image viewing with navigation
- ♿ **Accessibility**: Keyboard navigation, focus management, and screen reader support
- 📱 **Mobile Optimized**: Fully responsive design
- ⚡ **Infinite Scroll**: Load images progressively for better performance
- 🎨 **Custom Theme**: Beautiful diagonal gradient background

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **JSZip** - ZIP file creation for batch downloads
- **File-Saver** - File download utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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
