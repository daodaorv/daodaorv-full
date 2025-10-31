/**
 * 众筹编号生成器
 *
 * 生成各类众筹相关的唯一编号
 */

/**
 * 生成众筹项目编号
 * 格式: CF + YYYYMMDD + 4位序号
 * 示例: CF202510270001
 *
 * @param sequence 序号（1-9999）
 * @returns 项目编号
 */
export function generateProjectNo(sequence: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');

  return `CF${year}${month}${day}${seq}`;
}

/**
 * 生成众筹份额编号
 * 格式: SH + YYYYMMDD + 4位序号
 * 示例: SH202510270001
 *
 * @param sequence 序号（1-9999）
 * @returns 份额编号
 */
export function generateShareNo(sequence: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');

  return `SH${year}${month}${day}${seq}`;
}

/**
 * 生成分润编号
 * 格式: PS + YYYYMM
 * 示例: PS202510
 *
 * @param year 年份（可选，默认当前年份）
 * @param month 月份（可选，默认当前月份）
 * @returns 分润编号
 */
export function generateProfitSharingNo(year?: number, month?: number): string {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;
  const monthStr = String(m).padStart(2, '0');

  return `PS${y}${monthStr}`;
}

/**
 * 生成积分流水编号
 * 格式: PT + YYYYMMDD + 6位序号
 * 示例: PT2025102700001
 *
 * @param sequence 序号（1-999999）
 * @returns 积分流水编号
 */
export function generatePointsTransactionNo(sequence: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(6, '0');

  return `PT${year}${month}${day}${seq}`;
}

/**
 * 从数据库获取今日最大序号并生成新的项目编号
 *
 * @param getMaxSequence 获取最大序号的函数
 * @returns 新的项目编号
 */
export async function generateNextProjectNo(
  getMaxSequence: () => Promise<number>
): Promise<string> {
  const maxSeq = await getMaxSequence();
  return generateProjectNo(maxSeq + 1);
}

/**
 * 从数据库获取今日最大序号并生成新的份额编号
 *
 * @param getMaxSequence 获取最大序号的函数
 * @returns 新的份额编号
 */
export async function generateNextShareNo(getMaxSequence: () => Promise<number>): Promise<string> {
  const maxSeq = await getMaxSequence();
  return generateShareNo(maxSeq + 1);
}

/**
 * 从数据库获取今日最大序号并生成新的积分流水编号
 *
 * @param getMaxSequence 获取最大序号的函数
 * @returns 新的积分流水编号
 */
export async function generateNextPointsTransactionNo(
  getMaxSequence: () => Promise<number>
): Promise<string> {
  const maxSeq = await getMaxSequence();
  return generatePointsTransactionNo(maxSeq + 1);
}

/**
 * 解析项目编号获取日期和序号
 *
 * @param projectNo 项目编号
 * @returns 解析结果 { date: string, sequence: number } 或 null
 */
export function parseProjectNo(projectNo: string): { date: string; sequence: number } | null {
  const match = projectNo.match(/^CF(\d{8})(\d{4})$/);
  if (!match) return null;

  return {
    date: match[1], // YYYYMMDD
    sequence: parseInt(match[2], 10),
  };
}

/**
 * 解析份额编号获取日期和序号
 *
 * @param shareNo 份额编号
 * @returns 解析结果 { date: string, sequence: number } 或 null
 */
export function parseShareNo(shareNo: string): { date: string; sequence: number } | null {
  const match = shareNo.match(/^SH(\d{8})(\d{4})$/);
  if (!match) return null;

  return {
    date: match[1], // YYYYMMDD
    sequence: parseInt(match[2], 10),
  };
}

/**
 * 解析分润编号获取年月
 *
 * @param profitSharingNo 分润编号
 * @returns 解析结果 { year: number, month: number } 或 null
 */
export function parseProfitSharingNo(
  profitSharingNo: string
): { year: number; month: number } | null {
  const match = profitSharingNo.match(/^PS(\d{4})(\d{2})$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
  };
}

/**
 * 解析积分流水编号获取日期和序号
 *
 * @param transactionNo 积分流水编号
 * @returns 解析结果 { date: string, sequence: number } 或 null
 */
export function parsePointsTransactionNo(
  transactionNo: string
): { date: string; sequence: number } | null {
  const match = transactionNo.match(/^PT(\d{8})(\d{6})$/);
  if (!match) return null;

  return {
    date: match[1], // YYYYMMDD
    sequence: parseInt(match[2], 10),
  };
}
