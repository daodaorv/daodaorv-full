/**
 * 订单号生成工具
 * 格式：ORD + YYYYMMDD + 6位序号
 * 示例：ORD20251025000001
 */

/**
 * 生成订单号
 * @returns 订单号字符串
 */
export function generateOrderNumber(): string {
  // 获取当前日期 YYYYMMDD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // 生成6位随机序号
  const sequence = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  // 组合订单号
  return `ORD${dateStr}${sequence}`;
}

/**
 * 验证订单号格式
 * @param orderNo 订单号
 * @returns 是否有效
 */
export function validateOrderNumber(orderNo: string): boolean {
  // 格式：ORD + 8位日期 + 6位序号 = 17位
  const regex = /^ORD\d{8}\d{6}$/;
  return regex.test(orderNo);
}

/**
 * 从订单号中提取日期
 * @param orderNo 订单号
 * @returns 日期字符串 YYYY-MM-DD
 */
export function extractDateFromOrderNumber(orderNo: string): string | null {
  if (!validateOrderNumber(orderNo)) {
    return null;
  }

  const dateStr = orderNo.substring(3, 11); // YYYYMMDD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}
