# Simple API Connection Test
echo "Testing Claude API connection..."
echo "Endpoint: https://tuza.airaphe.com/api"

$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "cr_4ac4cdd80b904ef7a1590302a792f56fabff17e163f5f86ad7a6b63a6550083e"
    "anthropic-version" = "2023-06-01"
}

$body = @{
    model = "claude-3-sonnet-20240229"
    max_tokens = 50
    messages = @(
        @{
            role = "user"
            content = "Hello, connection test. Respond with 'API OK'"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://tuza.airaphe.com/api/v1/messages" -Method POST -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "SUCCESS: API connection working!" -ForegroundColor Green
    Write-Host "Response:" $response.content[0].text
} catch {
    Write-Host "FAILED: API connection error" -ForegroundColor Red
    Write-Host "Error:" $_.Exception.Message
}

Write-Host ""
Write-Host "Configuration Status:" -ForegroundColor Cyan
Write-Host "API Key: Configured" -ForegroundColor Green
Write-Host "Base URL: https://tuza.airaphe.com/api" -ForegroundColor Green
Write-Host "Claude Code: Ready" -ForegroundColor Green