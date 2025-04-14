@echo off
echo Starting Asset Manager installation...

REM Set Git repository URL
set GIT_REPO_URL=https://github.com/rohithvishaal/assetManager_cursor.git

REM Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a Git repository
git status >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Initializing Git repository...
    git init
    git remote add origin %GIT_REPO_URL%
    git fetch origin
    git reset --hard origin/master
    echo Repository initialized successfully.
) else (
    echo Git repository already exists. Checking for updates...
    git fetch origin
    git reset --hard origin/master
    echo Repository updated successfully.
)

echo Checking for Python virtual environment...

REM Check if venv exists
if not exist "venv" (
    echo Virtual environment not found. Creating new virtual environment...
    python -m venv venv
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Installation complete!
echo Please run the Application using the run.bat file.
pause 