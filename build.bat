@echo off
echo Building production package...

REM Create temporary build directory
if exist "temp_build" rmdir /s /q "temp_build"
mkdir temp_build

REM Copy necessary files to temporary directory
echo Copying files...
copy /Y main.py temp_build\
copy /Y requirements.txt temp_build\
copy /Y install.bat temp_build\
copy /Y prod.bat temp_build\
copy /Y README.md temp_build\

REM Create static directory and copy its contents
mkdir temp_build\static
xcopy /Y /E /I static\* temp_build\static\

REM Remove existing build directory if it exists
if exist "build" rmdir /s /q "build"

REM Rename temporary directory to build
ren temp_build build

echo Build complete!
echo Production package is ready in the build folder.
pause 