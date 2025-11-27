#!/bin/bash
# Build script for Linux

set -e

echo "🔧 Installing dependencies..."
npm install

echo "📦 Building for Linux..."
npm run build:linux

echo "✅ Build complete! Check the dist/ folder"
ls -la dist/

