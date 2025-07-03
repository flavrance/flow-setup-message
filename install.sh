#!/bin/bash

echo "🧹 Cleaning up existing installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "📦 Installing dependencies with React 19 compatibility..."
npm install --legacy-peer-deps

echo "✅ Installation complete!"
echo ""
echo "🚀 To start the development server:"
echo "npm run dev"
echo ""
echo "📝 Don't forget to set up your environment variables in .env.local"
