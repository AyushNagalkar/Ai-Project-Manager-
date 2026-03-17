@echo off
echo Installing Backend Dependencies...
cd backend-node
call npm install
cd ..

echo.
echo Installing Python Dependencies for Agents...
cd agents\planner
pip install -r requirements.txt
cd ..\research
pip install -r requirements.txt
cd ..\monitor
pip install -r requirements.txt
cd ..\documentation
pip install -r requirements.txt
cd ..\..

echo.
echo Installing Orchestrator Dependencies...
cd orchestrator
pip install -r requirements.txt
cd ..

echo.
echo Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ All dependencies installed!
echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo 2. Fill in your API keys and MongoDB URI
echo 3. Run: start-all.ps1
pause
