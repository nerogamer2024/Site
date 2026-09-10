@echo off
cd /d "%~dp0"
echo Starting PRO HACKER on http://localhost:3000 ...
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
npm start
pause
