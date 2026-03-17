# SmartPM - Start All Services
# Run this script to start all 8 services in separate windows

Write-Host ''
Write-Host '  Starting SmartPM Services...' -ForegroundColor Cyan

# 1. Backend API (port 5000)
Write-Host '  [1/8] Backend API...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\backend-node'; npm run dev"

Start-Sleep -Seconds 3

# 2. Orchestrator (port 8000)
Write-Host '  [2/8] Orchestrator...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\orchestrator'; .\venv\Scripts\Activate.ps1; python main.py"

# 3. Planner Agent (port 8001)
Write-Host '  [3/8] Planner Agent...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\agents\planner'; .\venv\Scripts\Activate.ps1; python main.py"

# 4. Research Agent (port 8002)
Write-Host '  [4/8] Research Agent...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\agents\research'; .\venv\Scripts\Activate.ps1; python main.py"

# 5. Monitor Agent (port 8003)
Write-Host '  [5/8] Monitor Agent...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\agents\monitor'; .\venv\Scripts\Activate.ps1; python main.py"

# 6. Documentation Agent (port 8004)
Write-Host '  [6/8] Documentation Agent...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\agents\documentation'; .\venv\Scripts\Activate.ps1; python main.py"

# 7. Resume Parser (port 8005)
Write-Host '  [7/8] Resume Parser...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\agents\resume-parser'; if (Test-Path .\venv\Scripts\Activate.ps1) { .\venv\Scripts\Activate.ps1 }; python main.py"

Start-Sleep -Seconds 5

# 8. Frontend (port 3000)
Write-Host '  [8/8] Frontend...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd 'H:\Project Manager\frontend'; npm run dev"

Write-Host ''
Write-Host '  All 8 services started!' -ForegroundColor Green
Write-Host ''
Write-Host '  Service                Port    URL' -ForegroundColor Cyan
Write-Host '  ---------------------  -----   -------------------------' -ForegroundColor DarkGray
Write-Host '  Backend API            5000    http://localhost:5000' -ForegroundColor White
Write-Host '  Orchestrator           8000    http://localhost:8000' -ForegroundColor White
Write-Host '  Planner Agent          8001    http://localhost:8001' -ForegroundColor White
Write-Host '  Research Agent         8002    http://localhost:8002' -ForegroundColor White
Write-Host '  Monitor Agent          8003    http://localhost:8003' -ForegroundColor White
Write-Host '  Documentation Agent    8004    http://localhost:8004' -ForegroundColor White
Write-Host '  Resume Parser          8005    http://localhost:8005' -ForegroundColor White
Write-Host '  Frontend               3000    http://localhost:3000' -ForegroundColor White
Write-Host ''
Write-Host '  To stop all: .\stop-all.ps1' -ForegroundColor Yellow
Write-Host ''
