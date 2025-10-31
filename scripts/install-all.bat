@echo off
echo ========================================
echo Installing Dependencies for All Projects
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Backend dependencies installation failed
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..
echo.

echo [2/4] Installing miniprogram dependencies...
cd miniprogram
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Miniprogram dependencies installation failed
    exit /b 1
)
echo [OK] Miniprogram dependencies installed
cd ..
echo.

echo [3/4] Installing admin-console dependencies...
cd admin-console
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Admin-console dependencies installation failed
    exit /b 1
)
echo [OK] Admin-console dependencies installed
cd ..
echo.

echo [4/4] Installing mobile-admin dependencies...
cd mobile-admin
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Mobile-admin dependencies installation failed
    exit /b 1
)
echo [OK] Mobile-admin dependencies installed
cd ..
echo.

echo ========================================
echo [SUCCESS] All dependencies installed!
echo ========================================

