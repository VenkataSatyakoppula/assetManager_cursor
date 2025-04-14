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

REM Clone the repository if not already cloned
if not exist ".git" (
    echo Cloning repository...
    git clone %GIT_REPO_URL% .
    if %ERRORLEVEL% neq 0 (
        echo Failed to clone repository. Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo Repository cloned successfully.
) else (
    echo Repository already exists.
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