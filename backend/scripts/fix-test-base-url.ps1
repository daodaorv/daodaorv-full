# 批量替换测试文件中的 BASE_URL 为 app

$testFiles = @(
    "tests/auth.test.ts",
    "tests/order.test.ts",
    "tests/vehicle.test.ts",
    "tests/wallet.test.ts"
)

foreach ($file in $testFiles) {
    Write-Host "Processing $file..."
    $content = Get-Content -Path $file -Raw
    
    # 替换 request(BASE_URL) 为 request(app)
    $content = $content -replace 'request\(BASE_URL\)', 'request(app)'
    
    # 替换 loginAndGetToken\((\w+), 为 loginAndGetToken(app, $1,
    $content = $content -replace 'loginAndGetToken\(([^,)]+),', 'loginAndGetToken(app, $1,'
    
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "✅ $file updated"
}

Write-Host ""
Write-Host "✅ All test files updated successfully!"

