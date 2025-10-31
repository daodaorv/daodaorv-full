import { AppDataSource } from '../config/database';
import { CrowdfundingShare, ShareStatus } from '../entities/CrowdfundingShare';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { OwnerPoints, PointsStatus } from '../entities/OwnerPoints';
import { PointsTransaction, TransactionType, PointsSource } from '../entities/PointsTransaction';
import { WalletService } from './wallet.service';
import { logger } from '../utils/logger';
import { generateNextShareNo, generateNextPointsTransactionNo } from '../utils/crowdfunding-number';
import { v4 as uuidv4 } from 'uuid';

/**
 * 众筹份额DTO接口
 */
export interface PurchaseSharesDTO {
  userId: string;
  projectId: string;
  shareCount: number;
}

export interface ShareListDTO {
  userId: string;
  page?: number;
  pageSize?: number;
  projectStatus?: ProjectStatus;
}

export interface SignAgreementDTO {
  shareId: string;
  agreementUrl: string;
}

/**
 * 众筹份额服务
 */
export class CrowdfundingShareService {
  private shareRepository = AppDataSource.getRepository(CrowdfundingShare);
  private walletService = new WalletService();

  /**
   * 购买份额
   */
  async purchaseShares(data: PurchaseSharesDTO): Promise<CrowdfundingShare> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证项目状态
      const project = await queryRunner.manager.findOne(CrowdfundingProject, {
        where: { id: data.projectId },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status !== ProjectStatus.ACTIVE) {
        throw new Error('项目未开放购买');
      }

      // 2. 验证剩余份额
      if (data.shareCount <= 0) {
        throw new Error('购买份额必须大于0');
      }

      if (data.shareCount > project.remainingShares) {
        throw new Error(`剩余份额不足，仅剩 ${project.remainingShares} 份`);
      }

      // 3. 计算购买金额
      const purchasePrice = project.sharePrice * data.shareCount;

      // 4. 验证用户钱包余额并扣款
      await this.walletService.consume({
        userId: data.userId,
        amount: purchasePrice,
        relatedId: data.projectId,
        relatedType: 'crowdfunding',
        description: `购买众筹份额 ${data.shareCount} 份`,
      });

      // 5. 生成份额编号
      const shareNo = await this.generateShareNo();

      // 6. 创建份额记录
      const share = queryRunner.manager.create(CrowdfundingShare, {
        id: uuidv4(),
        shareNo,
        projectId: data.projectId,
        userId: data.userId,
        shareCount: data.shareCount,
        purchasePrice,
        purchaseDate: new Date(),
        status: ShareStatus.ACTIVE,
      });

      await queryRunner.manager.save(share);

      // 7. 更新项目已售份额和已筹金额
      project.soldShares += data.shareCount;
      project.raisedAmount += purchasePrice;
      await queryRunner.manager.save(project);

      // 8. 创建或更新积分账户
      await this.createOrUpdatePointsAccount(
        queryRunner.manager,
        data.userId,
        purchasePrice,
        share.id
      );

      await queryRunner.commitTransaction();

      logger.info(`份额购买成功: ${shareNo}, 用户=${data.userId}, 份额=${data.shareCount}`);
      return share;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('购买份额失败:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取我的份额列表
   */
  async getMyShares(params: ShareListDTO): Promise<{
    shares: CrowdfundingShare[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.shareRepository
        .createQueryBuilder('share')
        .leftJoinAndSelect('share.project', 'project')
        .leftJoinAndSelect('project.vehicle', 'vehicle')
        .leftJoinAndSelect('vehicle.vehicleModel', 'vehicleModel')
        .where('share.userId = :userId', { userId: params.userId });

      // 筛选条件
      if (params.projectStatus) {
        queryBuilder.andWhere('project.status = :status', { status: params.projectStatus });
      }

      // 排序
      queryBuilder.orderBy('share.purchaseDate', 'DESC');

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [shares, total] = await queryBuilder.getManyAndCount();

      return {
        shares,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取我的份额列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取份额详情
   */
  async getShareById(shareId: string): Promise<CrowdfundingShare | null> {
    try {
      const share = await this.shareRepository.findOne({
        where: { id: shareId },
        relations: ['project', 'project.vehicle', 'project.vehicle.vehicleModel', 'user'],
      });

      return share;
    } catch (error) {
      logger.error('获取份额详情失败:', error);
      throw error;
    }
  }

  /**
   * 签署众筹协议
   */
  async signAgreement(data: SignAgreementDTO): Promise<CrowdfundingShare> {
    try {
      const share = await this.shareRepository.findOne({
        where: { id: data.shareId },
      });

      if (!share) {
        throw new Error('份额不存在');
      }

      if (share.isAgreementSigned) {
        throw new Error('协议已签署');
      }

      share.agreementUrl = data.agreementUrl;
      share.agreementSignedAt = new Date();

      await this.shareRepository.save(share);

      logger.info(`众筹协议签署成功: ${share.shareNo}`);
      return share;
    } catch (error) {
      logger.error('签署众筹协议失败:', error);
      throw error;
    }
  }

  /**
   * 获取份额统计
   */
  async getShareStats(): Promise<{
    totalShares: number;
    totalAmount: number;
    activeShares: number;
    transferredShares: number;
    redeemedShares: number;
  }> {
    try {
      const [totalShares, activeShares, transferredShares, redeemedShares] = await Promise.all([
        this.shareRepository.count(),
        this.shareRepository.count({ where: { status: ShareStatus.ACTIVE } }),
        this.shareRepository.count({ where: { status: ShareStatus.TRANSFERRED } }),
        this.shareRepository.count({ where: { status: ShareStatus.REDEEMED } }),
      ]);

      // 计算总购买金额
      const result = await this.shareRepository
        .createQueryBuilder('share')
        .select('SUM(share.purchasePrice)', 'total')
        .getRawOne();

      const totalAmount = parseFloat(result?.total || '0');

      return {
        totalShares,
        totalAmount,
        activeShares,
        transferredShares,
        redeemedShares,
      };
    } catch (error) {
      logger.error('获取份额统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有份额列表（管理端）
   */
  async getAllShares(params: {
    page?: number;
    pageSize?: number;
    status?: ShareStatus;
    projectId?: string;
    userId?: string;
  }): Promise<{
    shares: CrowdfundingShare[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.shareRepository
        .createQueryBuilder('share')
        .leftJoinAndSelect('share.project', 'project')
        .leftJoinAndSelect('share.user', 'user');

      // 筛选条件
      if (params.status) {
        queryBuilder.andWhere('share.status = :status', { status: params.status });
      }

      if (params.projectId) {
        queryBuilder.andWhere('share.projectId = :projectId', { projectId: params.projectId });
      }

      if (params.userId) {
        queryBuilder.andWhere('share.userId = :userId', { userId: params.userId });
      }

      // 排序
      queryBuilder.orderBy('share.purchaseDate', 'DESC');

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [shares, total] = await queryBuilder.getManyAndCount();

      return {
        shares,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取所有份额列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新积分账户
   */
  private async createOrUpdatePointsAccount(
    manager: any,
    userId: string,
    purchaseAmount: number,
    shareId: string
  ): Promise<void> {
    // 计算积分：购买金额 ÷ 10
    const points = Math.floor(purchaseAmount / 10);

    // 查找或创建积分账户
    let pointsAccount = await manager.findOne(OwnerPoints, {
      where: { userId },
    });

    if (!pointsAccount) {
      // 创建新账户
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1年后过期

      pointsAccount = manager.create(OwnerPoints, {
        id: uuidv4(),
        userId,
        balance: points,
        totalEarned: points,
        totalUsed: 0,
        expiryDate,
        status: PointsStatus.ACTIVE,
      });
    } else {
      // 更新现有账户
      pointsAccount.balance += points;
      pointsAccount.totalEarned += points;
    }

    await manager.save(pointsAccount);

    // 创建积分流水
    const transactionNo = await this.generatePointsTransactionNo();
    const transaction = manager.create(PointsTransaction, {
      id: uuidv4(),
      transactionNo,
      userId,
      type: TransactionType.EARN,
      amount: points,
      balance: pointsAccount.balance,
      source: PointsSource.PURCHASE,
      relatedId: shareId,
      description: `众筹购买获得积分`,
    });

    await manager.save(transaction);

    logger.info(`积分发放成功: 用户=${userId}, 积分=${points}`);
  }

  /**
   * 生成份额编号
   */
  private async generateShareNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const maxShare = await this.shareRepository
      .createQueryBuilder('share')
      .where('share.shareNo LIKE :prefix', { prefix: `SH${dateStr}%` })
      .orderBy('share.shareNo', 'DESC')
      .getOne();

    let sequence = 1;
    if (maxShare) {
      const lastSeq = parseInt(maxShare.shareNo.slice(-4), 10);
      sequence = lastSeq + 1;
    }

    return generateNextShareNo(async () => sequence - 1);
  }

  /**
   * 生成积分流水编号
   */
  private async generatePointsTransactionNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const pointsTransactionRepository = AppDataSource.getRepository(PointsTransaction);
    const maxTransaction = await pointsTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.transactionNo LIKE :prefix', { prefix: `PT${dateStr}%` })
      .orderBy('transaction.transactionNo', 'DESC')
      .getOne();

    let sequence = 1;
    if (maxTransaction) {
      const lastSeq = parseInt(maxTransaction.transactionNo.slice(-6), 10);
      sequence = lastSeq + 1;
    }

    return generateNextPointsTransactionNo(async () => sequence - 1);
  }
}
