Write-Host "Installing Backend Dependencies..." -ForegroundColor Green
cd "H:\Project Manager\backend-node"
npm install

# Create and setup virtual environments for Python projects
Write-Host "`nCreating Virtual Environments..." -ForegroundColor Green

# Orchestrator
Write-Host "Setting up Orchestrator environment..." -ForegroundColor Cyan
cd "H:\Project Manager\orchestrator"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

# Planner Agent
Write-Host "`nSetting up Planner Agent environment..." -ForegroundColor Cyan
cd "H:\Project Manager\agents\planner"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

# Research Agent
Write-Host "`nSetting up Research Agent environment..." -ForegroundColor Cyan
cd "H:\Project Manager\agents\research"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

# Monitor Agent
Write-Host "`nSetting up Monitor Agent environment..." -ForegroundColor Cyan
cd "H:\Project Manager\agents\monitor"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

# Documentation Agent
Write-Host "`nSetting up Documentation Agent environment..." -ForegroundColor Cyan
cd "H:\Project Manager\agents\documentation"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

Write-Host "`nInstalling Frontend Dependencies..." -ForegroundColor Green
cd "H:\Project Manager\frontend"
npm install

Write-Host "`n✅ All dependencies installed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.example to .env" -ForegroundColor White
Write-Host "2. Fill in your API keys and MongoDB URI" -ForegroundColor White
Write-Host "3. Run: .\start-all.ps1" -ForegroundColor White
