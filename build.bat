@echo off
REM Build script for Windows

echo Installing dependencies...
call npm install

echo Building for Windows...
call npm run build:win

echo Build complete! Check the dist\ folder
dir dist\

