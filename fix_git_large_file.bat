@echo off
echo Fixing Git Large File Error...
echo ---------------------------------------------------
echo Step 1: Removing node_modules from git tracking...
git rm -r --cached gurukulam-next/node_modules
if %ERRORLEVEL% NEQ 0 (
    echo Error removing node_modules. Proceeding anyway as it might be partially done or not tracked.
)

echo.
echo Step 2: Committing changes...
git commit -m "chore: remove node_modules from git tracking"

echo.
echo Step 3: Pushing to remote...
git push origin main

echo.
echo ---------------------------------------------------
echo Done. If there were errors, please check the output above.
pause
