@echo off
setlocal
set "GODOT=C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64.exe"
if not exist "%GODOT%" set "GODOT=godot"
cd /d "%~dp0..\.."
start "Wildbond Environment Sample" "%GODOT%" --path "%CD%" res://tests/environment_sample/play.tscn %*
