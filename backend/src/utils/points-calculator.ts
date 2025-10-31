import { PointsSource } from '../entities/PointsTransaction';

/**
 * 积分计算器
 * 用于计算各种场景下的积分数量和过期日期
 */

/**
 * 计算购买积分
 * 规则：购买金额 ÷ 10 = 积分
 * @param amount 购买金额（元）
 * @returns 积分数量
 */
export function calculatePurchasePoints(amount: number): number {
  if (amount <= 0) {
    throw new Error('购买金额必须大于0');
  }
  return Math.floor(amount / 10);
}

/**
 * 计算推广积分
 * 规则：交易金额 ÷ 100 = 积分
 * @param amount 交易金额（元）
 * @returns 积分数量
 */
export function calculateReferralPoints(amount: number): number {
  if (amount <= 0) {
    throw new Error('交易金额必须大于0');
  }
  return Math.floor(amount / 100);
}

/**
 * 计算追加购买积分
 * 规则：追加金额 ÷ 10 = 积分
 * @param amount 追加金额（元）
 * @returns 积分数量
 */
export function calculateAdditionalPoints(amount: number): number {
  if (amount <= 0) {
    throw new Error('追加金额必须大于0');
  }
  return Math.floor(amount / 10);
}

/**
 * 计算活动积分
 * 规则：按活动配置的比例计算
 * @param amount 金额（元）
 * @param ratio 积分比例（默认 1:10）
 * @returns 积分数量
 */
export function calculateActivityPoints(amount: number, ratio: number = 10): number {
  if (amount <= 0) {
    throw new Error('金额必须大于0');
  }
  if (ratio <= 0) {
    throw new Error('积分比例必须大于0');
  }
  return Math.floor(amount / ratio);
}

/**
 * 计算过期日期
 * 规则：从当前日期起 1 年后过期
 * @param fromDate 起始日期（默认为当前日期）
 * @returns 过期日期
 */
export function calculateExpiryDate(fromDate?: Date): Date {
  const date = fromDate || new Date();
  const expiryDate = new Date(date);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  return expiryDate;
}

/**
 * 计算追加购买积分的过期日期
 * 规则：从当前日期起 90 天后过期
 * @param fromDate 起始日期（默认为当前日期）
 * @returns 过期日期
 */
export function calculateAdditionalExpiryDate(fromDate?: Date): Date {
  const date = fromDate || new Date();
  const expiryDate = new Date(date);
  expiryDate.setDate(expiryDate.getDate() + 90);
  return expiryDate;
}

/**
 * 检查积分是否已过期
 * @param expiryDate 过期日期
 * @returns 是否已过期
 */
export function isPointsExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * 计算剩余天数
 * @param expiryDate 过期日期
 * @returns 剩余天数（已过期返回 0）
 */
export function calculateRemainingDays(expiryDate: Date): number {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 根据来源计算积分
 * @param source 积分来源
 * @param amount 金额（元）
 * @param ratio 自定义比例（可选）
 * @returns 积分数量
 */
export function calculatePointsBySource(
  source: PointsSource,
  amount: number,
  ratio?: number
): number {
  switch (source) {
    case PointsSource.PURCHASE:
      return calculatePurchasePoints(amount);
    case PointsSource.ADDITIONAL:
      return calculateAdditionalPoints(amount);
    case PointsSource.REFERRAL:
      return calculateReferralPoints(amount);
    case PointsSource.ACTIVITY:
    case PointsSource.GOVERNANCE:
      return calculateActivityPoints(amount, ratio);
    default:
      throw new Error(`不支持的积分来源: ${source}`);
  }
}

/**
 * 根据来源计算过期日期
 * @param source 积分来源
 * @param fromDate 起始日期（默认为当前日期）
 * @returns 过期日期
 */
export function calculateExpiryDateBySource(
  source: PointsSource,
  fromDate?: Date
): Date {
  switch (source) {
    case PointsSource.ADDITIONAL:
      return calculateAdditionalExpiryDate(fromDate);
    case PointsSource.PURCHASE:
    case PointsSource.REFERRAL:
    case PointsSource.ACTIVITY:
    case PointsSource.GOVERNANCE:
      return calculateExpiryDate(fromDate);
    default:
      throw new Error(`不支持的积分来源: ${source}`);
  }
}

/**
 * 验证积分数量
 * @param points 积分数量
 * @throws 如果积分数量无效
 */
export function validatePoints(points: number): void {
  if (!Number.isInteger(points)) {
    throw new Error('积分必须是整数');
  }
  if (points < 0) {
    throw new Error('积分不能为负数');
  }
}

/**
 * 验证积分余额是否足够
 * @param balance 当前余额
 * @param required 需要的积分
 * @throws 如果余额不足
 */
export function validateBalance(balance: number, required: number): void {
  validatePoints(balance);
  validatePoints(required);
  if (balance < required) {
    throw new Error(`积分余额不足，当前余额: ${balance}，需要: ${required}`);
  }
}

/**
 * 格式化积分显示
 * @param points 积分数量
 * @returns 格式化后的字符串
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('zh-CN');
}

/**
 * 计算年度清零日期
 * 规则：每年 12 月 31 日 23:59:59
 * @param year 年份（默认为当前年份）
 * @returns 清零日期
 */
export function calculateYearEndClearDate(year?: number): Date {
  const targetYear = year || new Date().getFullYear();
  return new Date(targetYear, 11, 31, 23, 59, 59, 999);
}

/**
 * 检查是否需要年度清零
 * @param lastClearDate 上次清零日期
 * @returns 是否需要清零
 */
export function shouldClearYearEnd(lastClearDate?: Date): boolean {
  const now = new Date();
  const currentYearEnd = calculateYearEndClearDate(now.getFullYear());
  
  if (!lastClearDate) {
    // 如果从未清零过，检查是否已过当年年底
    return now > currentYearEnd;
  }
  
  const lastClearYear = lastClearDate.getFullYear();
  const currentYear = now.getFullYear();
  
  // 如果上次清零是去年或更早，且已过当年年底，则需要清零
  return lastClearYear < currentYear && now > currentYearEnd;
}

