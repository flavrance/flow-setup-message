@echo off
echo 🧹 Cleaning up existing installation...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist yarn.lock del yarn.lock

echo 📦 Installing dependencies with React 19 compatibility...
npm install --legacy-peer-deps

echo ✅ Installation complete!
echo.
echo 🚀 To start the development server:
echo npm run dev
echo.
echo 📝 Don't forget to set up your environment variables in .env.local
pause
