@echo off
setlocal
if not defined GODOT set "GODOT=%USERPROFILE%\Godot\Godot_v4.7.2-stable_win64_console.exe"
"%GODOT%" --path "%~dp0..\.." --rendering-method forward_plus res://tests/thornwood_environment/play.tscn
