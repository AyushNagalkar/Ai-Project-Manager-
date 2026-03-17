Write-Host "`n===  Testing SmartPM Agents ===" -ForegroundColor Cyan

# Test Monitor Agent
Write-Host "`nTesting Monitor Agent..." -ForegroundColor Yellow
cd agents/monitor
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"
cd ../..
Start-Sleep -Seconds 3

# Test Planner Agent  
Write-Host "Testing Planner Agent..." -ForegroundColor Yellow
cd agents/planner
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"
cd ../..
Start-Sleep -Seconds 3

# Test Research Agent
Write-Host "Testing Research Agent..." -ForegroundColor Yellow
cd agents/research
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"
cd ../..
Start-Sleep -Seconds 3

# Test Documentation Agent
Write-Host "Testing Documentation Agent..." -ForegroundColor Yellow
cd agents/documentation
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"
cd ../..
Start-Sleep -Seconds 3

# Test Orchestrator
Write-Host "Testing Orchestrator..." -ForegroundColor Yellow
cd orchestrator
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"
cd ..
Start-Sleep -Seconds 3

Write-Host "`n✅ All agents started!" -ForegroundColor Green
Write-Host "Check each terminal window for errors" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
