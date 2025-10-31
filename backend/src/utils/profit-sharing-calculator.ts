/**
 * 分润计算器
 * 
 * 用于计算众筹项目的月度分润
 */

/**
 * 月度收入数据
 */
export interface MonthlyIncomeData {
  totalIncome: number; // 总收入
  orderCount: number; // 订单数量
}

/**
 * 月度成本数据
 */
export interface MonthlyCostData {
  insuranceFee: number; // 保险费
  maintenanceFee: number; // 维护费
  cleaningFee: number; // 清洁费
  platformServiceFee: number; // 平台服务费
}

/**
 * 分润计算结果
 */
export interface ProfitSharingCalculationResult {
  totalIncome: number; // 总收入
  totalCost: number; // 总成本
  netIncome: number; // 净收益
  profitSharingPerShare: number; // 每份分润
}

/**
 * 计算月收入
 * 
 * @param orders 订单列表
 * @returns 月收入数据
 */
export function calculateMonthlyIncome(orders: Array<{ totalAmount: number }>): MonthlyIncomeData {
  const totalIncome = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const orderCount = orders.length;

  return {
    totalIncome,
    orderCount,
  };
}

/**
 * 计算月成本
 * 
 * @param costData 成本数据
 * @returns 总成本
 */
export function calculateMonthlyCost(costData: MonthlyCostData): number {
  const { insuranceFee, maintenanceFee, cleaningFee, platformServiceFee } = costData;
  
  return insuranceFee + maintenanceFee + cleaningFee + platformServiceFee;
}

/**
 * 计算净收益
 * 
 * @param totalIncome 总收入
 * @param totalCost 总成本
 * @returns 净收益
 */
export function calculateNetIncome(totalIncome: number, totalCost: number): number {
  return Math.max(0, totalIncome - totalCost);
}

/**
 * 计算分润金额
 * 
 * @param netIncome 净收益
 * @param shareCount 份额数量
 * @param totalShares 总份额
 * @returns 分润金额
 */
export function calculateProfitSharingAmount(
  netIncome: number,
  shareCount: number,
  totalShares: number
): number {
  if (totalShares === 0) return 0;
  if (netIncome <= 0) return 0;
  
  const profitSharingPerShare = netIncome / totalShares;
  const profitSharingAmount = profitSharingPerShare * shareCount;
  
  // 保留两位小数
  return Math.round(profitSharingAmount * 100) / 100;
}

/**
 * 计算完整的分润数据
 * 
 * @param totalIncome 总收入
 * @param costData 成本数据
 * @param totalShares 总份额
 * @returns 分润计算结果
 */
export function calculateProfitSharing(
  totalIncome: number,
  costData: MonthlyCostData,
  totalShares: number
): ProfitSharingCalculationResult {
  const totalCost = calculateMonthlyCost(costData);
  const netIncome = calculateNetIncome(totalIncome, totalCost);
  const profitSharingPerShare = totalShares > 0 ? netIncome / totalShares : 0;

  return {
    totalIncome,
    totalCost,
    netIncome,
    profitSharingPerShare: Math.round(profitSharingPerShare * 100) / 100,
  };
}

/**
 * 计算平台服务费
 * 
 * @param totalIncome 总收入
 * @param serviceRate 服务费率（默认 5%）
 * @returns 平台服务费
 */
export function calculatePlatformServiceFee(
  totalIncome: number,
  serviceRate: number = 0.05
): number {
  return Math.round(totalIncome * serviceRate * 100) / 100;
}

/**
 * 验证分润计算参数
 * 
 * @param totalIncome 总收入
 * @param costData 成本数据
 * @param totalShares 总份额
 * @throws 参数无效时抛出错误
 */
export function validateProfitSharingParams(
  totalIncome: number,
  costData: MonthlyCostData,
  totalShares: number
): void {
  if (totalIncome < 0) {
    throw new Error('总收入不能为负数');
  }

  if (costData.insuranceFee < 0) {
    throw new Error('保险费不能为负数');
  }

  if (costData.maintenanceFee < 0) {
    throw new Error('维护费不能为负数');
  }

  if (costData.cleaningFee < 0) {
    throw new Error('清洁费不能为负数');
  }

  if (costData.platformServiceFee < 0) {
    throw new Error('平台服务费不能为负数');
  }

  if (totalShares <= 0) {
    throw new Error('总份额必须大于0');
  }
}

/**
 * 格式化分润期间
 * 
 * @param year 年份
 * @param month 月份
 * @returns 格式化的期间字符串（YYYY-MM）
 */
export function formatProfitSharingPeriod(year: number, month: number): string {
  const monthStr = String(month).padStart(2, '0');
  return `${year}-${monthStr}`;
}

/**
 * 解析分润期间
 * 
 * @param period 期间字符串（YYYY-MM）
 * @returns { year: number, month: number }
 */
export function parseProfitSharingPeriod(period: string): { year: number; month: number } {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error('无效的分润期间格式，应为 YYYY-MM');
  }

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
  };
}

/**
 * 获取上个月的期间
 * 
 * @param currentDate 当前日期（可选，默认为当前时间）
 * @returns 上个月的期间字符串（YYYY-MM）
 */
export function getLastMonthPeriod(currentDate?: Date): string {
  const date = currentDate || new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  if (month === 0) {
    // 1月，返回去年12月
    return formatProfitSharingPeriod(year - 1, 12);
  } else {
    return formatProfitSharingPeriod(year, month);
  }
}

/**
 * 获取指定期间的开始和结束日期
 * 
 * @param period 期间字符串（YYYY-MM）
 * @returns { startDate: Date, endDate: Date }
 */
export function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
  const { year, month } = parseProfitSharingPeriod(period);

  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    startDate,
    endDate,
  };
}

