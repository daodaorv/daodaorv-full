import * as cron from 'node-cron';
import { OwnerPointsService } from '../services/owner-points.service';
import { logger } from '../utils/logger';

/**
 * 积分过期任务
 *
 * 功能：
 * 1. 每天凌晨检查过期积分
 * 2. 自动扣除过期积分
 * 3. 创建过期流水记录
 * 4. 更新账户状态
 */
export class PointsExpiryTask {
  private ownerPointsService = new OwnerPointsService();

  /**
   * 执行积分过期处理
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行积分过期处理任务');

      // 调用积分服务处理过期积分
      const count = await this.ownerPointsService.expirePoints();

      logger.info(`积分过期处理任务执行完成: 处理了 ${count} 个账户`);
    } catch (error: any) {
      logger.error('积分过期处理任务执行失败:', error);
    }
  }
}

/**
 * 启动积分过期定时任务
 * 每天凌晨1点执行
 */
export function startPointsExpiryTask(): cron.ScheduledTask {
  const task = new PointsExpiryTask();

  logger.info('积分过期处理任务已启动，执行时间: 每天凌晨1点');

  // 使用 cron 表达式：每天凌晨1点
  // 格式：秒 分 时 日 月 星期
  const cronExpression = '0 1 * * *';

  return cron.schedule(cronExpression, () => {
    task.execute();
  });
}

/**
 * 手动执行积分过期处理（用于测试）
 */
export async function manualExecutePointsExpiry(): Promise<void> {
  const task = new PointsExpiryTask();
  await task.execute();
}

