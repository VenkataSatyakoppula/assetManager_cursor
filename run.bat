@echo off
echo Activating virtual environment...
call venv\Scripts\activate

echo Starting server...
start "" "http://localhost:8000/static/index.html"
uvicorn main:app --reload 