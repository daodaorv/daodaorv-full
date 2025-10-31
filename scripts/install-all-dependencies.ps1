# DaoDaoRV Install All Dependencies Script

Write-Host "========================================"
Write-Host "Installing Dependencies for All Projects"
Write-Host "========================================"
Write-Host ""

$projects = @("backend", "miniprogram", "admin-console", "mobile-admin")
$totalProjects = $projects.Count
$currentProject = 0

foreach ($project in $projects) {
    $currentProject++
    Write-Host "[$currentProject/$totalProjects] Installing dependencies for $project..." -ForegroundColor Cyan
    
    if (Test-Path $project) {
        Push-Location $project
        try {
            npm install
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   [OK] $project dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Host "   [FAIL] Failed to install $project dependencies" -ForegroundColor Red
            }
        } catch {
            Write-Host "   [FAIL] Error installing $project dependencies: $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "   [SKIP] $project directory not found" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "========================================"
Write-Host "[DONE] Dependency installation completed" -ForegroundColor Green
Write-Host "========================================"

