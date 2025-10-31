import * as cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { ProfitSharingService } from '../services/profit-sharing.service';
import { logger } from '../utils/logger';
import { getLastMonthPeriod } from '../utils/profit-sharing-calculator';

/**
 * 分润计算任务
 *
 * 功能：
 * 1. 每月1日自动计算上月分润
 * 2. 查找所有成功的众筹项目
 * 3. 计算每个项目的分润
 * 4. 生成分润记录
 */
export class ProfitSharingCalculationTask {
  private projectRepository = AppDataSource.getRepository(CrowdfundingProject);
  private profitSharingService = new ProfitSharingService();

  /**
   * 执行分润计算
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行分润计算任务');

      // 1. 获取上个月的期间
      const period = getLastMonthPeriod();
      logger.info(`计算期间: ${period}`);

      // 2. 查找所有成功的众筹项目
      const successProjects = await this.findSuccessProjects();

      if (successProjects.length === 0) {
        logger.info('没有成功的众筹项目需要计算分润');
        return;
      }

      logger.info(`发现 ${successProjects.length} 个成功的众筹项目`);

      // 3. 为每个项目计算分润
      let successCount = 0;
      let failedCount = 0;

      for (const project of successProjects) {
        try {
          await this.calculateProjectProfitSharing(project, period);
          successCount++;
        } catch (error: any) {
          logger.error(`计算项目分润失败: ${project.projectNo}`, error);
          failedCount++;
        }
      }

      logger.info(`分润计算任务执行完成: 成功=${successCount}, 失败=${failedCount}`);
    } catch (error: any) {
      logger.error('分润计算任务执行失败:', error);
    }
  }

  /**
   * 查找所有成功的众筹项目
   */
  private async findSuccessProjects(): Promise<CrowdfundingProject[]> {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.status = :status', { status: ProjectStatus.SUCCESS })
      .getMany();

    return projects;
  }

  /**
   * 计算单个项目的分润
   */
  private async calculateProjectProfitSharing(
    project: CrowdfundingProject,
    period: string
  ): Promise<void> {
    try {
      logger.info(`计算项目分润: ${project.projectNo}, 期间: ${period}`);

      // 调用分润服务计算分润
      const result = await this.profitSharingService.calculateProfitSharing({
        projectId: project.id,
        period,
      });

      logger.info(`项目 ${project.projectNo} 分润计算完成: 创建了 ${result.length} 条分润记录`);
    } catch (error: any) {
      // 如果是"已计算过"的错误，记录为info级别
      if (error.message && error.message.includes('已计算过')) {
        logger.info(`项目 ${project.projectNo} 在期间 ${period} 已计算过分润`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * 启动分润计算定时任务
 * 每月1日凌晨2点执行
 */
export function startProfitSharingCalculationTask(): cron.ScheduledTask {
  const task = new ProfitSharingCalculationTask();

  logger.info('分润计算任务已启动，执行时间: 每月1日凌晨2点');

  // 使用 cron 表达式：每月1日凌晨2点
  // 格式：秒 分 时 日 月 星期
  const cronExpression = '0 2 1 * *';

  return cron.schedule(cronExpression, () => {
    task.execute();
  });
}

/**
 * 手动执行分润计算（用于测试）
 */
export async function manualExecuteProfitSharingCalculation(): Promise<void> {
  const task = new ProfitSharingCalculationTask();
  await task.execute();
}
