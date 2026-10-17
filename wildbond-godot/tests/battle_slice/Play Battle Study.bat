@echo off
setlocal
if not defined GODOT set "GODOT=C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64_console.exe"
if not exist "%GODOT%" (
  echo Set GODOT to your Godot 4.7.2 console executable first.
  pause
  exit /b 1
)
"%GODOT%" --path "%~dp0..\.." res://tests/battle_slice/play.tscn
