#!/bin/bash

# API连接测试脚本
# 测试自定义Claude API服务是否可用

echo "🔍 测试Claude API连接..."
echo "API端点: https://tuza.airaphe.com/api"
echo "API Key: cr_4ac4cdd80b904ef7a1590302a792f56fabff17e163f5f86ad7a6b63a6550083e"
echo ""

# 测试API连接
response=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST \
  "https://tuza.airaphe.com/api/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: cr_4ac4cdd80b904ef7a1590302a792f56fabff17e163f5f86ad7a6b63a6550083e" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "Hello, this is a connection test. Please respond with \"API connection successful!\""
      }
    ]
  }')

# 提取HTTP状态码
http_code=$(echo "$response" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)

# 提取响应内容
content=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "📊 测试结果:"
echo "HTTP状态码: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ API连接成功！"
    echo "📝 响应内容:"
    echo "$content" | jq -r '.content[0].text' 2>/dev/null || echo "$content"
else
    echo "❌ API连接失败"
    echo "📝 错误信息:"
    echo "$content"
fi

echo ""
echo "🔧 配置信息:"
echo "✅ API Key已配置"
echo "✅ Base URL已设置"
echo "✅ Claude Code环境已准备就绪"