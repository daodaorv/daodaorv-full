# DaoDaoRV Environment Verification Script

Write-Host "========================================"
Write-Host "DaoDaoRV Environment Verification"
Write-Host "========================================"
Write-Host ""

$allPassed = $true

# 1. Check Node.js
Write-Host "1. Checking Node.js..."
try {
    $nodeVersion = node -v
    if ($nodeVersion -match "v(1[8-9]|2[0-9])\.") {
        Write-Host "   [OK] Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Node.js version (need v18+): $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] Node.js not installed" -ForegroundColor Red
    $allPassed = $false
}

# 2. Check npm
Write-Host "2. Checking npm..."
try {
    $npmVersion = npm -v
    Write-Host "   [OK] npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] npm not installed" -ForegroundColor Red
    $allPassed = $false
}

# 3. Check Docker
Write-Host "3. Checking Docker..."
try {
    $dockerVersion = & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version
    Write-Host "   [OK] Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Docker not installed or not running" -ForegroundColor Red
    $allPassed = $false
}

# 4. Check Docker containers
Write-Host "4. Checking Docker containers..."
try {
    $containers = & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" ps --format "{{.Names}}"

    if ($containers -contains "daodao-mysql") {
        Write-Host "   [OK] MySQL container is running" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] MySQL container is not running" -ForegroundColor Red
        $allPassed = $false
    }

    if ($containers -contains "daodao-redis") {
        Write-Host "   [OK] Redis container is running" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Redis container is not running" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   [FAIL] Cannot check Docker containers" -ForegroundColor Red
    $allPassed = $false
}

# 5. Check project directory structure
Write-Host "5. Checking project directories..."
$requiredDirs = @(
    "backend/src",
    "miniprogram/src",
    "admin-console/src",
    "mobile-admin/src"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "   [OK] $dir exists" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $dir does not exist" -ForegroundColor Red
        $allPassed = $false
    }
}

# 6. Check configuration files
Write-Host "6. Checking configuration files..."
$requiredFiles = @(
    "backend/package.json",
    "backend/tsconfig.json",
    "backend/.env",
    "miniprogram/package.json",
    "admin-console/package.json",
    "mobile-admin/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file exists" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $file does not exist" -ForegroundColor Red
        $allPassed = $false
    }
}

# 7. Check dependencies
Write-Host "7. Checking dependencies..."
$projectDirs = @("backend", "miniprogram", "admin-console", "mobile-admin")

foreach ($dir in $projectDirs) {
    if (Test-Path "$dir/node_modules") {
        Write-Host "   [OK] $dir dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] $dir dependencies not installed (run: cd $dir; npm install)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "========================================"
if ($allPassed) {
    Write-Host "[SUCCESS] All required checks passed!" -ForegroundColor Green
    Write-Host "Note: If dependencies are not installed, run npm install in each project directory" -ForegroundColor Yellow
} else {
    Write-Host "[FAILED] Some checks failed, please fix according to the above messages" -ForegroundColor Red
}
Write-Host "========================================"

