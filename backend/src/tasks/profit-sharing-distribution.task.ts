import * as cron from 'node-cron';
import { ProfitSharingService } from '../services/profit-sharing.service';
import { logger } from '../utils/logger';
import { getLastMonthPeriod } from '../utils/profit-sharing-calculator';

/**
 * 分润发放任务
 *
 * 功能：
 * 1. 每月10日自动发放上月分润
 * 2. 查找待发放的分润记录
 * 3. 转入用户钱包
 * 4. 更新分润状态
 */
export class ProfitSharingDistributionTask {
  private profitSharingService = new ProfitSharingService();

  /**
   * 执行分润发放
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行分润发放任务');

      // 1. 获取上个月的期间
      const period = getLastMonthPeriod();
      logger.info(`发放期间: ${period}`);

      // 2. 调用分润服务发放分润
      const count = await this.profitSharingService.distributeProfitSharing(period);

      logger.info(`分润发放任务执行完成: 发放了 ${count} 条分润记录`);
    } catch (error: any) {
      logger.error('分润发放任务执行失败:', error);
    }
  }
}

/**
 * 启动分润发放定时任务
 * 每月10日凌晨3点执行
 */
export function startProfitSharingDistributionTask(): cron.ScheduledTask {
  const task = new ProfitSharingDistributionTask();

  logger.info('分润发放任务已启动，执行时间: 每月10日凌晨3点');

  // 使用 cron 表达式：每月10日凌晨3点
  // 格式：秒 分 时 日 月 星期
  const cronExpression = '0 3 10 * *';

  return cron.schedule(cronExpression, () => {
    task.execute();
  });
}

/**
 * 手动执行分润发放（用于测试）
 */
export async function manualExecuteProfitSharingDistribution(): Promise<void> {
  const task = new ProfitSharingDistributionTask();
  await task.execute();
}
