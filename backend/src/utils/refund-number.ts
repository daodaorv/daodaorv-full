/**
 * 生成退款单号
 * 格式：RFD + YYYYMMDD + 6位随机数
 * 示例：RFD20251026123456
 */
export function generateRefundNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

  return `RFD${year}${month}${day}${random}`;
}

