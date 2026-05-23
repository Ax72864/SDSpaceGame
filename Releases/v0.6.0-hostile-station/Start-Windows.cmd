@echo off
cd /d "%~dp0Game"
echo Starting Star Ring Station v0.6.0-hostile-station local server...
echo Open http://localhost:5500 in your browser
python -m http.server 5500
