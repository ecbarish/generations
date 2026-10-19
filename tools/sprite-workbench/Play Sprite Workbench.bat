@echo off
cd /d "%~dp0"
set "WORKBENCH_GODOT=%GODOT%"
if not defined WORKBENCH_GODOT set "WORKBENCH_GODOT=C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64.exe"
"%WORKBENCH_GODOT%" --path "%~dp0" res://workbench.tscn
