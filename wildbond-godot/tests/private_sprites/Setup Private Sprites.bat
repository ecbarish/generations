@echo off
setlocal
if not defined PYTHON set "PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PYTHON%" (
  echo Set PYTHON to a Python executable with Pillow available.
  pause
  exit /b 1
)
"%PYTHON%" -B "%~dp0..\..\..\tools\wildbond-private-sprites.py"
if errorlevel 1 (
  echo Setup did not finish. No public game or saved journey was changed.
  pause
  exit /b 1
)
echo Private sprites are ready. Open Play Private Clearing.bat next.
pause
