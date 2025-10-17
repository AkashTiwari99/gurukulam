@echo off
REM Simple static server for Windows using Python's http.server module
REM Run this from the repository root (double-clicking will open the server in the current folder)

:: Try to use the py launcher first, then python
npy -3 -m http.server 8000 2>nul || python -m http.server 8000

necho Server started on http://localhost:8000
necho Press Ctrl+C to stop the server
pause >nul