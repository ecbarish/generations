@echo off
setlocal
if not defined GODOT set "GODOT=C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64.exe"
"%GODOT%" --path "%~dp0..\.." --rendering-method forward_plus res://tests/mega_tide_readability/play.tscn
