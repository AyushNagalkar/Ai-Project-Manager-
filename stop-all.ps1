# SmartPM - Stop All Services
# Kills all processes on SmartPM ports

Write-Host ''
Write-Host '  Stopping SmartPM Services...' -ForegroundColor Red

$ports = @(5000, 3000, 8000, 8001, 8002, 8003, 8004, 8005)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $procIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $procIds) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process on port $port (PID: $procId)" -ForegroundColor Yellow
        }
    }
}

Write-Host ''
Write-Host '  All SmartPM services stopped!' -ForegroundColor Green
Write-Host ''
