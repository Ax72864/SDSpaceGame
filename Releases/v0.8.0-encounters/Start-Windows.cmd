@echo off
cd /d "%~dp0Game"
echo Starting Star Ring Station v0.8.0-encounters local server...
echo Open http://localhost:5500 in your browser
python -m http.server 5500
