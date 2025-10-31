import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { OrderService } from '../services/order.service';

/**
 * 押金自动退还定时任务
 */
class DepositAutoRefundTask {
  private orderService: OrderService;
  private cronTask: any;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * 启动定时任务
   */
  start(): void {
    if (this.cronTask) {
      logger.warn('押金自动退还任务已在运行');
      return;
    }

    // 每天凌晨2点执行
    this.cronTask = cron.schedule('0 2 * * *', async () => {
      await this.processAutoRefunds();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    logger.info('押金自动退还任务已启动 - 每天凌晨2点执行');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('押金自动退还任务已停止');
    }
  }

  /**
   * 立即执行一次自动退还处理
   */
  async runOnce(): Promise<void> {
    await this.processAutoRefunds();
  }

  /**
   * 处理自动退还
   */
  private async processAutoRefunds(): Promise<void> {
    try {
      logger.info('开始处理押金自动退还任务');

      const result = await this.orderService.processViolationDepositAutoRefunds();

      logger.info(`押金自动退还任务完成 - 成功: ${result.processed}, 失败: ${result.failed}`);

      // 如果有失败的情况，发送告警
      if (result.failed > 0) {
        logger.error(`有 ${result.failed} 个违章押金退还失败，需要人工处理`);
        // TODO: 这里可以添加邮件或短信告警
      }

    } catch (error: any) {
      logger.error('押金自动退还任务执行失败:', error);
      // TODO: 这里可以添加错误告警
    }
  }

  /**
   * 获取任务状态
   */
  getStatus(): { running: boolean; nextExecution?: Date } {
    return {
      running: !!this.cronTask,
      nextExecution: this.cronTask?.getNextRun?.toDate()
    };
  }
}

// 导出单例实例
export const depositAutoRefundTask = new DepositAutoRefundTask();

/**
 * 启动押金自动退还任务
 */
export function startDepositAutoRefundTask(): void {
  depositAutoRefundTask.start();
}

/**
 * 停止押金自动退还任务
 */
export function stopDepositAutoRefundTask(): void {
  depositAutoRefundTask.stop();
}

/**
 * 立即执行一次押金自动退还任务
 */
export async function runDepositAutoRefundOnce(): Promise<void> {
  await depositAutoRefundTask.runOnce();
}