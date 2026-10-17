@echo off
setlocal
if not defined GODOT set "GODOT=C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64_console.exe"
if not exist "%GODOT%" (
  echo Set GODOT to your Godot 4.7.2 console executable.
  pause
  exit /b 1
)
"%GODOT%" --rendering-method gl_compatibility --path "%~dp0..\.." res://tests/private_sprites/play.tscn
