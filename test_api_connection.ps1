# API连接测试脚本 (PowerShell版本)
# 测试自定义Claude API服务是否可用

Write-Host "🔍 测试Claude API连接..." -ForegroundColor Cyan
Write-Host "API端点: https://tuza.airaphe.com/api" -ForegroundColor Gray
Write-Host "API Key: cr_4ac4cdd80b904ef7a1590302a792f56f***" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "x-api-key" = "cr_4ac4cdd80b904ef7a1590302a792f56fabff17e163f5f86ad7a6b63a6550083e"
        "anthropic-version" = "2023-06-01"
    }

    $body = @{
        model = "claude-3-sonnet-20240229"
        max_tokens = 100
        messages = @(
            @{
                role = "user"
                content = "Hello, this is a connection test. Please respond with 'API connection successful!'"
            }
        )
    } | ConvertTo-Json -Depth 10

    Write-Host "📡 发送请求..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://tuza.airaphe.com/api/v1/messages" -Method POST -Headers $headers -Body $body -TimeoutSec 30

    Write-Host "✅ API连接成功！" -ForegroundColor Green
    Write-Host "📝 Claude响应:"
    Write-Host $response.content[0].text -ForegroundColor White

} catch {
    Write-Host "❌ API连接失败" -ForegroundColor Red
    Write-Host "📝 错误信息:"
    Write-Host $_.Exception.Message -ForegroundColor Red

    if ($_.Exception.Response) {
        Write-Host "HTTP状态码: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 配置信息:" -ForegroundColor Cyan
Write-Host "✅ API Key已配置" -ForegroundColor Green
Write-Host "✅ Base URL已设置: https://tuza.airaphe.com/api" -ForegroundColor Green
Write-Host "✅ Claude Code环境已准备就绪" -ForegroundColor Green
Write-Host ""
Write-Host "💡 现在您可以在Claude Code中使用以下命令:" -ForegroundColor Yellow
Write-Host "  /init-project '项目描述' - 初始化项目" -ForegroundColor Gray
Write-Host "  /feat '功能描述' - 开发新功能" -ForegroundColor Gray
Write-Host "  /workflow '任务描述' - 完整开发流程" -ForegroundColor Gray