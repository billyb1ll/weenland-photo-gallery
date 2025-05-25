#!/bin/bash

# Weenland Photo Gallery - Google Cloud Storage Setup Script
# สคริปต์ตั้งค่า Google Cloud Storage สำหรับ Weenland Photo Gallery

echo "🏞️ Weenland Photo Gallery - Google Cloud Storage Setup"
echo "======================================================="

# Check if required tools are installed
echo "🔍 ตรวจสอบเครื่องมือที่จำเป็น..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 กำลังติดตั้ง dependencies..."
npm install @google-cloud/storage sharp

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create credentials directory
echo ""
echo "📁 สร้างโฟลเดอร์ credentials..."
mkdir -p credentials

if [ $? -eq 0 ]; then
    echo "✅ Created credentials directory"
else
    echo "❌ Failed to create credentials directory"
    exit 1
fi

# Check if .env.example exists and create .env
echo ""
echo "⚙️ สร้างไฟล์ .env..."

if [ -f .env.example ]; then
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo ""
        echo "📝 กรุณาแก้ไขไฟล์ .env ด้วยข้อมูลของคุณ:"
        echo "   - GOOGLE_CLOUD_PROJECT_ID=your-project-id"
        echo "   - GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name"
        echo "   - NEXT_PUBLIC_BUCKET_BASE_URL=https://storage.googleapis.com/your-bucket-name"
    else
        echo "⚠️ .env file already exists. Skipping..."
    fi
else
    echo "❌ .env.example not found"
    exit 1
fi

# Instructions for next steps
echo ""
echo "🎯 ขั้นตอนต่อไป:"
echo "================"
echo "1. 📖 อ่านคู่มือใน GOOGLE_CLOUD_THAI_GUIDE.md"
echo "2. 🔐 วางไฟล์ Service Account JSON ใน credentials/gcp-service-account.json"
echo "3. ⚙️ แก้ไขไฟล์ .env ตามข้อมูล Google Cloud ของคุณ"
echo "4. 🚀 รันเซิร์ฟเวอร์ด้วย npm run dev"
echo ""
echo "📚 คู่มือเต็ม: https://console.cloud.google.com/"
echo "💡 หากมีปัญหา ดูที่ส่วน 'การแก้ไขปัญหาที่พบบ่อย' ในคู่มือ"
echo ""
echo "✨ Setup completed! Happy coding! ✨"
