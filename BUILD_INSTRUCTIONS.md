# Building ClAI Windows Executable

This document explains how to build ClAI as a Windows executable.

## Prerequisites

- Node.js installed on your system
- npm package manager

## Build Methods

### Method 1: Using npm scripts (Recommended)

```bash
# Build Windows installer and portable executable
npm run build:win

# Or build all platforms
npm run build
```

### Method 2: Using the batch script

Double-click `build-windows.bat` or run:
```cmd
build-windows.bat
```

### Method 3: Manual step-by-step

```bash
# Install dependencies
npm install

# Build CSS
npm run build:css

# Build renderer
npm run build-renderer

# Create Windows executable
npm run build:win
```

## Output Files

After building, you'll find the following files in the `dist` folder:

- **`ClAI - Career Coach AI Setup 1.0.0.exe`** - Windows installer (recommended for distribution)
  - Creates desktop and start menu shortcuts
  - Includes uninstaller
  - Installs to Program Files

- **`ClAI - Career Coach AI 1.0.0.exe`** - Portable executable
  - Single file that can be run directly
  - No installation required
  - Can be placed anywhere on the system

## Configuration

The build configuration is located in `package.json` under the `"build"` section. Key settings:

- **appId**: `com.cristian.clai`
- **productName**: `ClAI - Career Coach AI`
- **Target formats**: NSIS installer and portable executable
- **Architecture**: x64 (64-bit)

## Troubleshooting

### Build fails with icon error
If you see an icon-related error, the build configuration will automatically use the default Electron icon.

### Missing dependencies
Run `npm install` to ensure all dependencies are installed.

### Permission errors
Make sure you have write permissions to the project directory.

## Customization

To customize the executable:

1. **Icon**: Add a valid `.ico` file and update the `build.win.icon` path in `package.json`
2. **App name**: Modify `productName` in the build configuration
3. **Installer options**: Adjust the `nsis` section in the build configuration

## Distribution

- **For end users**: Distribute the `.exe` installer file
- **For portable use**: Distribute the portable `.exe` file
- Both files are ready to run on Windows 10/11 (64-bit)
