@echo off
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
pause 