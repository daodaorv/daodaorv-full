import { AppDataSource } from '../../config/database';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType } from '../../entities/WalletTransaction';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';
import { TimeRange } from './order-statistics.service';

/**
 * 财务统计查询 DTO
 */
export interface FinanceStatisticsQuery {
  timeRange?: TimeRange;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 财务统计服务
 */
export class FinanceStatisticsService {
  private walletRepository: Repository<Wallet>;
  private walletTransactionRepository: Repository<WalletTransaction>;

  constructor() {
    this.walletRepository = AppDataSource.getRepository(Wallet);
    this.walletTransactionRepository = AppDataSource.getRepository(WalletTransaction);
  }

  /**
   * 获取财务统计
   */
  async getFinanceStatistics(query: FinanceStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 钱包总余额
      const totalBalance = await this.getTotalWalletBalance();

      // 充值统计
      const rechargeStats = await this.getRechargeStats(startDate, endDate);

      // 消费统计
      const consumeStats = await this.getConsumeStats(startDate, endDate);

      return {
        period: {
          startDate,
          endDate,
        },
        totalBalance,
        recharge: rechargeStats,
        consume: consumeStats,
      };
    } catch (error: any) {
      logger.error(`获取财务统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取钱包统计
   */
  async getWalletStatistics() {
    try {
      // 钱包总数
      const totalWallets = await this.walletRepository.count();

      // 总余额
      const totalBalance = await this.getTotalWalletBalance();

      // 冻结金额
      const totalFrozen = await this.getTotalFrozenAmount();

      // 可用余额
      const availableBalance = totalBalance - totalFrozen;

      return {
        totalWallets,
        totalBalance,
        totalFrozen,
        availableBalance,
      };
    } catch (error: any) {
      logger.error(`获取钱包统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取提现统计
   */
  async getWithdrawalStatistics() {
    try {
      // TODO: 实现提现统计（需要 Withdrawal 实体）
      return {
        period: {
          startDate: new Date(),
          endDate: new Date(),
        },
        totalCount: 0,
        pendingCount: 0,
        completedCount: 0,
        totalAmount: 0,
      };
    } catch (error: any) {
      logger.error(`获取提现统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取钱包总余额
   */
  private async getTotalWalletBalance(): Promise<number> {
    const wallets = await this.walletRepository.find({
      select: ['balance'],
    });

    return wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
  }

  /**
   * 获取总冻结金额
   */
  private async getTotalFrozenAmount(): Promise<number> {
    const wallets = await this.walletRepository.find({
      select: ['frozenAmount'],
    });

    return wallets.reduce((sum, wallet) => sum + Number(wallet.frozenAmount), 0);
  }

  /**
   * 获取充值统计
   */
  private async getRechargeStats(startDate: Date, endDate: Date) {
    const transactions = await this.walletTransactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        type: TransactionType.RECHARGE,
      },
      select: ['amount'],
    });

    const count = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      count,
      totalAmount,
    };
  }

  /**
   * 获取消费统计
   */
  private async getConsumeStats(startDate: Date, endDate: Date) {
    const transactions = await this.walletTransactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        type: TransactionType.CONSUME,
      },
      select: ['amount'],
    });

    const count = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      count,
      totalAmount,
    };
  }

  /**
   * 获取日期范围
   */
  private getDateRange(query: FinanceStatisticsQuery): { startDate: Date; endDate: Date } {
    if (query.startDate && query.endDate) {
      return {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const endDate = new Date();
    const startDate = new Date();

    switch (query.timeRange) {
      case TimeRange.DAY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case TimeRange.WEEK:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case TimeRange.MONTH:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case TimeRange.YEAR:
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }
}
