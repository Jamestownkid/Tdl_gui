# TDL GUI

A beautiful desktop GUI for [tdl](https://github.com/iyear/tdl) - Telegram Downloader.

![TDL GUI](screenshot.png)

## Features

- **Login** - QR Code, Phone+Code, or import from Telegram Desktop
- **Download** - Download media from Telegram links or exported JSON
- **Upload** - Upload files to Saved Messages or any chat
- **Forward** - Forward messages between chats
- **Export** - Export messages to JSON

## Requirements

- [tdl](https://github.com/iyear/tdl) must be installed and available in PATH
- Node.js 18+ (for development)

## Quick Start

### Install tdl first

```bash
# Linux/macOS
curl -sSL https://raw.githubusercontent.com/iyear/tdl/master/scripts/install.sh | bash

# Windows (PowerShell)
iwr -useb https://raw.githubusercontent.com/iyear/tdl/master/scripts/install.ps1 | iex
```

### Run the GUI

```bash
# Install dependencies
npm install

# Start the app
npm start
```

## Build for Distribution

### Linux
```bash
npm run build:linux
```
Creates: `dist/TDL-x.x.x.AppImage` and `dist/tdl-gui_x.x.x_amd64.deb`

### Windows
```bash
npm run build:win
```
Creates: `dist/TDL Setup x.x.x.exe` (installer) and `dist/TDL x.x.x.exe` (portable)

## How It Works

This is a simple wrapper around the `tdl` CLI. Each button runs the corresponding tdl command:

| GUI Action | CLI Command |
|------------|-------------|
| Login (QR) | `tdl login -T qr` |
| Login (Code) | `tdl login -T code` |
| Login (Desktop) | `tdl login` |
| Download | `tdl dl -u <url>` |
| Upload | `tdl up -p <path>` |
| Forward | `tdl forward --from <url>` |
| Export | `tdl chat export -c <chat>` |

The GUI doesn't reimplement any logic - it just provides a nice interface to run the existing commands.

## License

AGPL-3.0 (same as tdl)

