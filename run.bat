@echo off
echo Starting Asset Manager...

REM Set Git repository URL
set GIT_REPO_URL=https://github.com/rohithvishaal/assetManager_cursor.git

REM Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Git is not installed. Please install Git to enable automatic updates.
    goto start_app
)

REM Check if this is a Git repository
git status >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Initializing Git repository...
    git init
    git remote add origin %GIT_REPO_URL%
    git fetch origin
    git checkout -b master
    goto start_app
)

REM Check for updates
echo Checking for updates from remote repository...
git fetch origin
git diff --quiet origin/master
if %ERRORLEVEL% neq 0 (
    echo Updates available. Pulling latest changes...
    git pull origin master
    echo Updates installed successfully.
) else (
    echo No updates available.
)

:start_app
REM Activate virtual environment
echo Activating virtual environment...
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else (
    echo Virtual environment not found. Please run install.bat first.
    pause
    exit /b 1
)

REM Start the application
echo Starting server...
start "" "http://localhost:8000/static/index.html"
uvicorn main:app --reload