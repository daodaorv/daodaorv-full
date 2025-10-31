import { AppDataSource } from '../config/database';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { CrowdfundingShare, ShareStatus } from '../entities/CrowdfundingShare';
import { WalletService } from '../services/wallet.service';
import { logger } from '../utils/logger';

/**
 * 众筹状态检查任务
 *
 * 功能：
 * 1. 查找进行中的众筹项目
 * 2. 检查众筹期限是否已到
 * 3. 检查已售份额是否达到最低成功份额
 * 4. 自动标记项目为成功或失败
 * 5. 失败项目自动退款给车主
 */
export class CrowdfundingStatusTask {
  private projectRepository = AppDataSource.getRepository(CrowdfundingProject);
  private shareRepository = AppDataSource.getRepository(CrowdfundingShare);
  private walletService = new WalletService();

  /**
   * 执行众筹状态检查
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行众筹状态检查任务');

      // 1. 查找进行中的众筹项目
      const activeProjects = await this.findActiveProjects();

      if (activeProjects.length === 0) {
        logger.info('没有进行中的众筹项目需要检查');
        return;
      }

      logger.info(`发现 ${activeProjects.length} 个进行中的众筹项目`);

      // 2. 检查每个项目的状态
      for (const project of activeProjects) {
        await this.checkProjectStatus(project);
      }

      logger.info('众筹状态检查任务执行完成');
    } catch (error: any) {
      logger.error('众筹状态检查任务执行失败:', error);
    }
  }

  /**
   * 查找进行中的众筹项目
   */
  private async findActiveProjects(): Promise<CrowdfundingProject[]> {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.status = :status', { status: ProjectStatus.ACTIVE })
      .getMany();

    return projects;
  }

  /**
   * 检查单个项目状态
   */
  private async checkProjectStatus(project: CrowdfundingProject): Promise<void> {
    try {
      logger.info(`检查众筹项目: ${project.projectNo}`);

      // 1. 检查是否售罄
      if (project.isSoldOut) {
        await this.markProjectSuccess(project);
        return;
      }

      // 2. 检查众筹期限是否已到
      if (!project.isEnded) {
        logger.info(`项目 ${project.projectNo} 众筹期限未到，剩余 ${project.remainingDays} 天`);
        return;
      }

      // 3. 众筹期限已到，检查是否达到最低成功份额
      if (project.isMinSuccessReached) {
        await this.markProjectSuccess(project);
      } else {
        await this.markProjectFailed(project);
      }
    } catch (error: any) {
      logger.error(`检查项目状态失败: ${project.projectNo}`, error);
    }
  }

  /**
   * 标记项目为成功
   */
  private async markProjectSuccess(project: CrowdfundingProject): Promise<void> {
    try {
      logger.info(`标记项目为成功: ${project.projectNo}`);

      project.status = ProjectStatus.SUCCESS;
      await this.projectRepository.save(project);

      logger.info(`项目 ${project.projectNo} 已标记为成功`);
    } catch (error: any) {
      logger.error(`标记项目成功失败: ${project.projectNo}`, error);
    }
  }

  /**
   * 标记项目为失败并退款
   */
  private async markProjectFailed(project: CrowdfundingProject): Promise<void> {
    try {
      logger.info(`标记项目为失败: ${project.projectNo}`);

      // 1. 更新项目状态为失败
      project.status = ProjectStatus.FAILED;
      await this.projectRepository.save(project);

      // 2. 查找该项目的所有份额
      const shares = await this.shareRepository.find({
        where: {
          projectId: project.id,
          status: ShareStatus.ACTIVE,
        },
      });

      logger.info(`项目 ${project.projectNo} 有 ${shares.length} 个份额需要退款`);

      // 3. 为每个份额退款
      for (const share of shares) {
        await this.refundShare(share, project);
      }

      logger.info(`项目 ${project.projectNo} 已标记为失败，退款完成`);
    } catch (error: any) {
      logger.error(`标记项目失败失败: ${project.projectNo}`, error);
    }
  }

  /**
   * 退款给车主
   */
  private async refundShare(share: CrowdfundingShare, project: CrowdfundingProject): Promise<void> {
    try {
      logger.info(`退款给车主: 份额=${share.shareNo}, 金额=${share.purchasePrice}`);

      // 1. 退款到钱包（使用 refund 方法）
      await this.walletService.refund(
        share.userId,
        share.purchasePrice,
        share.id,
        'crowdfunding',
        `众筹项目失败退款: ${project.projectName}`
      );

      // 2. 更新份额状态为已赎回
      share.status = ShareStatus.REDEEMED;
      await this.shareRepository.save(share);

      logger.info(`退款成功: 份额=${share.shareNo}`);
    } catch (error: any) {
      logger.error(`退款失败: 份额=${share.shareNo}`, error);
    }
  }
}

/**
 * 启动众筹状态检查定时任务
 * 每小时执行一次
 */
export function startCrowdfundingStatusTask(): NodeJS.Timeout {
  const task = new CrowdfundingStatusTask();
  const intervalHours = 1;

  logger.info(`众筹状态检查任务已启动，执行间隔: ${intervalHours} 小时`);

  // 立即执行一次
  task.execute();

  // 定时执行
  return setInterval(
    () => {
      task.execute();
    },
    intervalHours * 60 * 60 * 1000
  );
}
