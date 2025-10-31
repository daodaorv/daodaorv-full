import { AppDataSource } from '../config/database';
import { ProfitSharing, ProfitSharingStatus } from '../entities/ProfitSharing';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { CrowdfundingShare, ShareStatus } from '../entities/CrowdfundingShare';
import { Order, OrderStatus } from '../entities/Order';
import { WalletService } from './wallet.service';
import { logger } from '../utils/logger';
import {
  calculateProfitSharing,
  calculatePlatformServiceFee,
  getPeriodDateRange,
  MonthlyCostData,
} from '../utils/profit-sharing-calculator';
import { generateProfitSharingNo } from '../utils/crowdfunding-number';
import { v4 as uuidv4 } from 'uuid';

/**
 * 分润DTO接口
 */
export interface CalculateProfitSharingDTO {
  projectId: string;
  period: string; // YYYY-MM
  insuranceFee?: number;
  maintenanceFee?: number;
  cleaningFee?: number;
}

export interface ProfitSharingListDTO {
  userId: string;
  page?: number;
  pageSize?: number;
  period?: string;
  status?: ProfitSharingStatus;
}

/**
 * 分润服务
 */
export class ProfitSharingService {
  private profitSharingRepository = AppDataSource.getRepository(ProfitSharing);
  private walletService = new WalletService();

  /**
   * 计算分润
   */
  async calculateProfitSharing(data: CalculateProfitSharingDTO): Promise<ProfitSharing[]> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证项目
      const project = await queryRunner.manager.findOne(CrowdfundingProject, {
        where: { id: data.projectId },
        relations: ['vehicle'],
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status !== ProjectStatus.SUCCESS) {
        throw new Error('只能为成功的众筹项目计算分润');
      }

      // 2. 检查是否已计算过该期间的分润
      const existingProfitSharings = await queryRunner.manager.find(ProfitSharing, {
        where: {
          projectId: data.projectId,
          period: data.period,
        },
      });

      if (existingProfitSharings.length > 0) {
        throw new Error(`该期间（${data.period}）的分润已计算`);
      }

      // 3. 查询该期间的订单收入
      const { startDate, endDate } = getPeriodDateRange(data.period);
      const orders = await queryRunner.manager
        .createQueryBuilder(Order, 'order')
        .where('order.vehicleId = :vehicleId', { vehicleId: project.vehicleId })
        .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany();

      const totalIncome = orders.reduce((sum, order) => sum + order.totalPrice, 0);

      // 4. 计算成本
      const platformServiceFee = calculatePlatformServiceFee(totalIncome);
      const costData: MonthlyCostData = {
        insuranceFee: data.insuranceFee || 0,
        maintenanceFee: data.maintenanceFee || 0,
        cleaningFee: data.cleaningFee || 0,
        platformServiceFee,
      };

      // 5. 计算分润
      const calculation = calculateProfitSharing(totalIncome, costData, project.totalShares);

      // 如果净收益 <= 0，不生成分润记录
      if (calculation.netIncome <= 0) {
        await queryRunner.commitTransaction();
        logger.info(`项目 ${project.projectNo} 期间 ${data.period} 无净收益，不生成分润记录`);
        return [];
      }

      // 6. 查询所有活跃份额
      const shares = await queryRunner.manager.find(CrowdfundingShare, {
        where: {
          projectId: data.projectId,
          status: ShareStatus.ACTIVE,
        },
      });

      if (shares.length === 0) {
        throw new Error('该项目没有活跃份额');
      }

      // 7. 为每个份额创建分润记录
      const profitSharingNo = generateProfitSharingNo();
      const profitSharings: ProfitSharing[] = [];

      for (const share of shares) {
        const profitSharingAmount = calculation.profitSharingPerShare * share.shareCount;

        const profitSharing = queryRunner.manager.create(ProfitSharing, {
          id: uuidv4(),
          profitSharingNo: `${profitSharingNo}-${share.userId.slice(0, 8)}`,
          projectId: data.projectId,
          userId: share.userId,
          shareId: share.id,
          period: data.period,
          shareCount: share.shareCount,
          totalIncome: calculation.totalIncome,
          totalCost: calculation.totalCost,
          netIncome: calculation.netIncome,
          profitSharingAmount,
          status: ProfitSharingStatus.PENDING,
        });

        await queryRunner.manager.save(profitSharing);
        profitSharings.push(profitSharing);
      }

      await queryRunner.commitTransaction();

      logger.info(
        `分润计算成功: 项目=${project.projectNo}, 期间=${data.period}, 分润记录=${profitSharings.length}`
      );
      return profitSharings;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('计算分润失败:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 发放分润
   */
  async distributeProfitSharing(period: string): Promise<number> {
    try {
      // 查询待发放的分润记录
      const profitSharings = await this.profitSharingRepository.find({
        where: {
          period,
          status: ProfitSharingStatus.PENDING,
        },
      });

      if (profitSharings.length === 0) {
        logger.info(`期间 ${period} 没有待发放的分润`);
        return 0;
      }

      let successCount = 0;

      // 逐个发放分润
      for (const profitSharing of profitSharings) {
        try {
          // 转入用户钱包（使用 adjustBalance 方法）
          await this.walletService.adjustBalance({
            userId: profitSharing.userId,
            amount: profitSharing.profitSharingAmount,
            reason: `众筹分润 ${profitSharing.period}`,
            operatorId: 'system',
          });

          // 更新分润状态
          profitSharing.status = ProfitSharingStatus.PAID;
          profitSharing.paidAt = new Date();
          await this.profitSharingRepository.save(profitSharing);

          successCount++;
          logger.info(`分润发放成功: ${profitSharing.profitSharingNo}, 金额=${profitSharing.profitSharingAmount}`);
        } catch (error) {
          // 标记为失败
          profitSharing.status = ProfitSharingStatus.FAILED;
          await this.profitSharingRepository.save(profitSharing);

          logger.error(`分润发放失败: ${profitSharing.profitSharingNo}`, error);
        }
      }

      logger.info(`分润发放完成: 期间=${period}, 成功=${successCount}/${profitSharings.length}`);
      return successCount;
    } catch (error) {
      logger.error('发放分润失败:', error);
      throw error;
    }
  }

  /**
   * 获取我的分润记录
   */
  async getMyProfitSharings(params: ProfitSharingListDTO): Promise<{
    profitSharings: ProfitSharing[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.profitSharingRepository
        .createQueryBuilder('profitSharing')
        .leftJoinAndSelect('profitSharing.project', 'project')
        .leftJoinAndSelect('profitSharing.share', 'share')
        .where('profitSharing.userId = :userId', { userId: params.userId });

      // 筛选条件
      if (params.period) {
        queryBuilder.andWhere('profitSharing.period = :period', { period: params.period });
      }

      if (params.status) {
        queryBuilder.andWhere('profitSharing.status = :status', { status: params.status });
      }

      // 排序
      queryBuilder.orderBy('profitSharing.period', 'DESC');

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [profitSharings, total] = await queryBuilder.getManyAndCount();

      return {
        profitSharings,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取我的分润记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取分润详情
   */
  async getProfitSharingById(profitSharingId: string): Promise<ProfitSharing | null> {
    try {
      const profitSharing = await this.profitSharingRepository.findOne({
        where: { id: profitSharingId },
        relations: ['project', 'project.vehicle', 'share', 'user'],
      });

      return profitSharing;
    } catch (error) {
      logger.error('获取分润详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取分润统计
   */
  async getProfitSharingStats(): Promise<{
    totalProfitSharings: number;
    totalAmount: number;
    pendingProfitSharings: number;
    paidProfitSharings: number;
    failedProfitSharings: number;
  }> {
    try {
      const [totalProfitSharings, pendingProfitSharings, paidProfitSharings, failedProfitSharings] = await Promise.all(
        [
          this.profitSharingRepository.count(),
          this.profitSharingRepository.count({ where: { status: ProfitSharingStatus.PENDING } }),
          this.profitSharingRepository.count({ where: { status: ProfitSharingStatus.PAID } }),
          this.profitSharingRepository.count({ where: { status: ProfitSharingStatus.FAILED } }),
        ]
      );

      // 计算总分润金额
      const result = await this.profitSharingRepository
        .createQueryBuilder('profitSharing')
        .select('SUM(profitSharing.profitSharingAmount)', 'total')
        .where('profitSharing.status = :status', { status: ProfitSharingStatus.PAID })
        .getRawOne();

      const totalAmount = parseFloat(result?.total || '0');

      return {
        totalProfitSharings,
        totalAmount,
        pendingProfitSharings,
        paidProfitSharings,
        failedProfitSharings,
      };
    } catch (error) {
      logger.error('获取分润统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有分润记录（管理端）
   */
  async getAllProfitSharings(params: {
    page?: number;
    pageSize?: number;
    period?: string;
    status?: ProfitSharingStatus;
    projectId?: string;
  }): Promise<{
    profitSharings: ProfitSharing[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.profitSharingRepository
        .createQueryBuilder('profitSharing')
        .leftJoinAndSelect('profitSharing.project', 'project')
        .leftJoinAndSelect('profitSharing.user', 'user');

      // 筛选条件
      if (params.period) {
        queryBuilder.andWhere('profitSharing.period = :period', { period: params.period });
      }

      if (params.status) {
        queryBuilder.andWhere('profitSharing.status = :status', { status: params.status });
      }

      if (params.projectId) {
        queryBuilder.andWhere('profitSharing.projectId = :projectId', { projectId: params.projectId });
      }

      // 排序
      queryBuilder.orderBy('profitSharing.period', 'DESC');

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [profitSharings, total] = await queryBuilder.getManyAndCount();

      return {
        profitSharings,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取所有分润记录失败:', error);
      throw error;
    }
  }
}

