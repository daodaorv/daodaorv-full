import { AppDataSource } from '../config/database';
import { OwnerPoints, PointsStatus } from '../entities/OwnerPoints';
import { PointsTransaction, TransactionType, PointsSource } from '../entities/PointsTransaction';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { generateNextPointsTransactionNo } from '../utils/crowdfunding-number';
import {
  calculatePointsBySource,
  calculateExpiryDateBySource,
  validateBalance,
  validatePoints,
} from '../utils/points-calculator';

/**
 * 获得积分DTO
 */
export interface EarnPointsDTO {
  userId: string;
  amount: number;
  source: PointsSource;
  relatedId?: string;
  description?: string;
  ratio?: number; // 自定义积分比例（可选）
}

/**
 * 使用积分DTO
 */
export interface UsePointsDTO {
  userId: string;
  points: number;
  relatedId?: string;
  description?: string;
}

/**
 * 车主积分服务
 */
export class OwnerPointsService {
  private pointsRepository = AppDataSource.getRepository(OwnerPoints);
  private transactionRepository = AppDataSource.getRepository(PointsTransaction);

  /**
   * 创建积分账户
   */
  async createPointsAccount(userId: string): Promise<OwnerPoints> {
    try {
      // 检查是否已存在
      const existing = await this.pointsRepository.findOne({
        where: { userId },
      });

      if (existing) {
        throw new Error('积分账户已存在');
      }

      // 创建新账户
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const account = this.pointsRepository.create({
        id: uuidv4(),
        userId,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
        expiryDate,
        status: PointsStatus.ACTIVE,
      });

      await this.pointsRepository.save(account);

      logger.info(`积分账户创建成功: userId=${userId}`);
      return account;
    } catch (error: any) {
      logger.error('Failed to create points account:', error);
      throw error;
    }
  }

  /**
   * 获得积分
   */
  async earnPoints(data: EarnPointsDTO): Promise<PointsTransaction> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 计算积分数量
      const points = calculatePointsBySource(data.source, data.amount, data.ratio);
      validatePoints(points);

      // 2. 查找或创建积分账户
      let account = await queryRunner.manager.findOne(OwnerPoints, {
        where: { userId: data.userId },
      });

      if (!account) {
        // 创建新账户
        const expiryDate = calculateExpiryDateBySource(data.source);
        account = queryRunner.manager.create(OwnerPoints, {
          id: uuidv4(),
          userId: data.userId,
          balance: points,
          totalEarned: points,
          totalUsed: 0,
          expiryDate,
          status: PointsStatus.ACTIVE,
        });
      } else {
        // 更新现有账户
        account.balance += points;
        account.totalEarned += points;

        // 如果账户已过期或已清零，重新激活
        if (account.status !== PointsStatus.ACTIVE) {
          account.status = PointsStatus.ACTIVE;
          account.expiryDate = calculateExpiryDateBySource(data.source);
        }
      }

      await queryRunner.manager.save(account);

      // 3. 创建积分流水
      const transactionNo = await this.generateTransactionNo();
      const transaction = queryRunner.manager.create(PointsTransaction, {
        id: uuidv4(),
        transactionNo,
        userId: data.userId,
        type: TransactionType.EARN,
        amount: points,
        balance: account.balance,
        source: data.source,
        relatedId: data.relatedId,
        description: data.description || `获得积分`,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      logger.info(`积分发放成功: userId=${data.userId}, points=${points}, source=${data.source}`);
      return transaction;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error('Failed to earn points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 使用积分
   */
  async usePoints(data: UsePointsDTO): Promise<PointsTransaction> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证积分数量
      validatePoints(data.points);

      // 2. 查找积分账户
      const account = await queryRunner.manager.findOne(OwnerPoints, {
        where: { userId: data.userId },
      });

      if (!account) {
        throw new Error('积分账户不存在');
      }

      if (account.status !== PointsStatus.ACTIVE) {
        throw new Error('积分账户未激活');
      }

      // 3. 验证余额
      validateBalance(account.balance, data.points);

      // 4. 扣除积分
      account.balance -= data.points;
      account.totalUsed += data.points;
      await queryRunner.manager.save(account);

      // 5. 创建积分流水
      const transactionNo = await this.generateTransactionNo();
      const transaction = queryRunner.manager.create(PointsTransaction, {
        id: uuidv4(),
        transactionNo,
        userId: data.userId,
        type: TransactionType.USE,
        amount: data.points,
        balance: account.balance,
        relatedId: data.relatedId,
        description: data.description || `使用积分`,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      logger.info(`积分使用成功: userId=${data.userId}, points=${data.points}`);
      return transaction;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error('Failed to use points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取我的积分
   */
  async getMyPoints(userId: string): Promise<OwnerPoints | null> {
    try {
      const account = await this.pointsRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      return account;
    } catch (error: any) {
      logger.error('Failed to get my points:', error);
      throw error;
    }
  }

  /**
   * 获取积分流水
   */
  async getPointsTransactions(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      type?: TransactionType;
      source?: PointsSource;
    } = {}
  ): Promise<{ transactions: PointsTransaction[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, type, source } = options;

      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.userId = :userId', { userId })
        .orderBy('transaction.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize);

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      if (source) {
        queryBuilder.andWhere('transaction.source = :source', { source });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      return { transactions, total };
    } catch (error: any) {
      logger.error('Failed to get points transactions:', error);
      throw error;
    }
  }

  /**
   * 过期积分（定时任务调用）
   */
  async expirePoints(): Promise<number> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查询已过期但状态仍为 ACTIVE 的账户
      const expiredAccounts = await queryRunner.manager
        .createQueryBuilder(OwnerPoints, 'points')
        .where('points.status = :status', { status: PointsStatus.ACTIVE })
        .andWhere('points.expiryDate < :now', { now: new Date() })
        .andWhere('points.balance > 0')
        .getMany();

      let count = 0;

      for (const account of expiredAccounts) {
        // 创建过期流水
        const transactionNo = await this.generateTransactionNo();
        const transaction = queryRunner.manager.create(PointsTransaction, {
          id: uuidv4(),
          transactionNo,
          userId: account.userId,
          type: TransactionType.EXPIRE,
          amount: account.balance,
          balance: 0,
          description: `积分过期`,
        });

        await queryRunner.manager.save(transaction);

        // 更新账户状态
        account.balance = 0;
        account.status = PointsStatus.EXPIRED;
        await queryRunner.manager.save(account);

        count++;
        logger.info(`积分过期: userId=${account.userId}, points=${transaction.amount}`);
      }

      await queryRunner.commitTransaction();

      logger.info(`积分过期处理完成: 共处理 ${count} 个账户`);
      return count;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error('Failed to expire points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 清零积分（年度清零，定时任务调用）
   */
  async clearPoints(): Promise<number> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查询所有活跃且有余额的账户
      const activeAccounts = await queryRunner.manager
        .createQueryBuilder(OwnerPoints, 'points')
        .where('points.status = :status', { status: PointsStatus.ACTIVE })
        .andWhere('points.balance > 0')
        .getMany();

      let count = 0;

      for (const account of activeAccounts) {
        // 创建清零流水
        const transactionNo = await this.generateTransactionNo();
        const transaction = queryRunner.manager.create(PointsTransaction, {
          id: uuidv4(),
          transactionNo,
          userId: account.userId,
          type: TransactionType.CLEAR,
          amount: account.balance,
          balance: 0,
          description: `年度积分清零`,
        });

        await queryRunner.manager.save(transaction);

        // 更新账户状态
        account.balance = 0;
        account.status = PointsStatus.CLEARED;
        await queryRunner.manager.save(account);

        count++;
        logger.info(`积分清零: userId=${account.userId}, points=${transaction.amount}`);
      }

      await queryRunner.commitTransaction();

      logger.info(`积分清零处理完成: 共处理 ${count} 个账户`);
      return count;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error('Failed to clear points:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取所有积分账户（管理端）
   */
  async getAllPoints(
    options: {
      page?: number;
      pageSize?: number;
      status?: PointsStatus;
      keyword?: string;
    } = {}
  ): Promise<{ accounts: OwnerPoints[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, status, keyword } = options;

      const queryBuilder = this.pointsRepository
        .createQueryBuilder('points')
        .leftJoinAndSelect('points.user', 'user')
        .orderBy('points.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize);

      if (status) {
        queryBuilder.andWhere('points.status = :status', { status });
      }

      if (keyword) {
        queryBuilder.andWhere('(user.username LIKE :keyword OR user.phone LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }

      const [accounts, total] = await queryBuilder.getManyAndCount();

      return { accounts, total };
    } catch (error: any) {
      logger.error('Failed to get all points:', error);
      throw error;
    }
  }

  /**
   * 发放积分（管理端）
   */
  async grantPoints(data: EarnPointsDTO): Promise<PointsTransaction> {
    // 使用 earnPoints 方法，但来源为 ACTIVITY
    return this.earnPoints({
      ...data,
      source: data.source || PointsSource.ACTIVITY,
    });
  }

  /**
   * 获取积分统计（管理端）
   */
  async getPointsStats(): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    expiredAccounts: number;
    clearedAccounts: number;
    totalBalance: number;
    totalEarned: number;
    totalUsed: number;
  }> {
    try {
      const [totalAccounts, activeAccounts, expiredAccounts, clearedAccounts] = await Promise.all([
        this.pointsRepository.count(),
        this.pointsRepository.count({ where: { status: PointsStatus.ACTIVE } }),
        this.pointsRepository.count({ where: { status: PointsStatus.EXPIRED } }),
        this.pointsRepository.count({ where: { status: PointsStatus.CLEARED } }),
      ]);

      // 计算总余额、总获得、总使用
      const result = await this.pointsRepository
        .createQueryBuilder('points')
        .select('SUM(points.balance)', 'totalBalance')
        .addSelect('SUM(points.totalEarned)', 'totalEarned')
        .addSelect('SUM(points.totalUsed)', 'totalUsed')
        .getRawOne();

      return {
        totalAccounts,
        activeAccounts,
        expiredAccounts,
        clearedAccounts,
        totalBalance: parseInt(result?.totalBalance || '0'),
        totalEarned: parseInt(result?.totalEarned || '0'),
        totalUsed: parseInt(result?.totalUsed || '0'),
      };
    } catch (error: any) {
      logger.error('Failed to get points stats:', error);
      throw error;
    }
  }

  /**
   * 生成积分流水编号
   */
  private async generateTransactionNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const maxTransaction = await this.transactionRepository
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
