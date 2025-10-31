/**
 * 生成提现单号
 * 格式：WD + YYYYMMDD + 6位随机序号
 * 示例：WD20251025123456
 */
export function generateWithdrawalNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // 生成6位随机序号
  const sequence = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  // 组合提现单号
  return `WD${dateStr}${sequence}`;
}

/**
 * 验证提现单号格式
 */
export function validateWithdrawalNumber(withdrawalNo: string): boolean {
  // WD + 8位日期 + 6位序号 = 16位
  const pattern = /^WD\d{14}$/;
  return pattern.test(withdrawalNo);
}

/**
 * 从提现单号中提取日期
 */
export function extractDateFromWithdrawalNumber(withdrawalNo: string): Date | null {
  if (!validateWithdrawalNumber(withdrawalNo)) {
    return null;
  }

  const dateStr = withdrawalNo.substring(2, 10); // YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));

  return new Date(year, month, day);
}
