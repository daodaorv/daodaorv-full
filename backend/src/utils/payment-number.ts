/**
 * 生成支付单号
 * 格式：PAY + YYYYMMDD + 6位随机数字
 * 示例：PAY20251026123456
 */
export function generatePaymentNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

  return `PAY${year}${month}${day}${random}`;
}

