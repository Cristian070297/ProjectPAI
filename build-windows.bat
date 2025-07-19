@echo off
echo Building ClAI Windows Executable...
echo.
echo Step 1: Installing dependencies...
call npm install
echo.
echo Step 2: Building CSS...
call npm run build:css
echo.
echo Step 3: Building renderer...
call npm run build-renderer
echo.
echo Step 4: Creating Windows executable...
call electron-builder --win
echo.
echo Build complete! Check the 'dist' folder for your executables:
echo - ClAI - Career Coach AI Setup 1.0.0.exe (installer)
echo - ClAI - Career Coach AI 1.0.0.exe (portable)
echo.
pause
