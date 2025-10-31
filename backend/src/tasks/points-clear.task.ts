import * as cron from 'node-cron';
import { OwnerPointsService } from '../services/owner-points.service';
import { logger } from '../utils/logger';

/**
 * 积分年度清零任务
 *
 * 功能：
 * 1. 每年12月31日23:59执行
 * 2. 清零所有活跃账户的积分余额
 * 3. 创建清零流水记录
 * 4. 更新账户状态为已清零
 */
export class PointsClearTask {
  private ownerPointsService = new OwnerPointsService();

  /**
   * 执行积分清零处理
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行积分年度清零任务');

      // 调用积分服务清零积分
      const count = await this.ownerPointsService.clearPoints();

      logger.info(`积分年度清零任务执行完成: 处理了 ${count} 个账户`);
    } catch (error: any) {
      logger.error('积分年度清零任务执行失败:', error);
    }
  }
}

/**
 * 启动积分年度清零定时任务
 * 每年12月31日23:59执行
 */
export function startPointsClearTask(): cron.ScheduledTask {
  const task = new PointsClearTask();

  logger.info('积分年度清零任务已启动，执行时间: 每年12月31日23:59');

  // 使用 cron 表达式：每年12月31日23:59
  // 格式：秒 分 时 日 月 星期
  const cronExpression = '0 59 23 31 12 *';

  return cron.schedule(cronExpression, () => {
    task.execute();
  });
}

/**
 * 手动执行积分清零（用于测试）
 */
export async function manualExecutePointsClear(): Promise<void> {
  const task = new PointsClearTask();
  await task.execute();
}

