import { AppDataSource } from '../../config/database';
import { User } from '../../entities/User';
import { Order } from '../../entities/Order';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';
import { TimeRange } from './order-statistics.service';

/**
 * 用户统计查询 DTO
 */
export interface UserStatisticsQuery {
  timeRange?: TimeRange;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 用户统计服务
 */
export class UserStatisticsService {
  private userRepository: Repository<User>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * 获取用户统计
   */
  async getUserStatistics(query: UserStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 新增用户数
      const newUsers = await this.userRepository.count({
        where: {
          created_at: Between(startDate, endDate),
        },
      });

      // 总用户数
      const totalUsers = await this.userRepository.count();

      // 活跃用户数（有订单的用户）
      const activeUsers = await this.getActiveUsers(startDate, endDate);

      return {
        period: {
          startDate,
          endDate,
        },
        newUsers,
        totalUsers,
        activeUsers,
        activeRate: totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(2)) : 0,
      };
    } catch (error: any) {
      logger.error(`获取用户统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取用户增长趋势
   */
  async getUserGrowthTrend(query: UserStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);
      const timeRange = query.timeRange || TimeRange.DAY;

      const trend: any[] = [];
      const current = new Date(startDate);

      while (current < endDate) {
        const periodStart = new Date(current);
        const periodEnd = this.getNextPeriod(current, timeRange);

        const newUsers = await this.userRepository.count({
          where: {
            created_at: Between(periodStart, periodEnd),
          },
        });

        const totalUsers = await this.userRepository.count({
          where: {
            created_at: Between(new Date(0), periodEnd),
          },
        });

        trend.push({
          date: periodStart.toISOString().split('T')[0],
          newUsers,
          totalUsers,
        });

        current.setTime(periodEnd.getTime());
      }

      return trend;
    } catch (error: any) {
      logger.error(`获取用户增长趋势失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehavior(query: UserStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 下单用户数
      const orderedUsers = await this.getActiveUsers(startDate, endDate);

      // 总用户数
      const totalUsers = await this.userRepository.count();

      // 下单转化率
      const conversionRate = totalUsers > 0 ? (orderedUsers / totalUsers) * 100 : 0;

      // 平均订单数
      const totalOrders = await this.orderRepository.count({
        where: {
          created_at: Between(startDate, endDate),
        },
      });

      const avgOrdersPerUser = orderedUsers > 0 ? totalOrders / orderedUsers : 0;

      // 复购用户数（有2个以上订单的用户）
      const repeatUsers = await this.getRepeatUsers(startDate, endDate);

      // 复购率
      const repeatRate = orderedUsers > 0 ? (repeatUsers / orderedUsers) * 100 : 0;

      return {
        period: {
          startDate,
          endDate,
        },
        totalUsers,
        orderedUsers,
        conversionRate: Number(conversionRate.toFixed(2)),
        avgOrdersPerUser: Number(avgOrdersPerUser.toFixed(2)),
        repeatUsers,
        repeatRate: Number(repeatRate.toFixed(2)),
      };
    } catch (error: any) {
      logger.error(`获取用户行为分析失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取活跃用户数
   */
  private async getActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT order.userId)', 'count')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return parseInt(result.count) || 0;
  }

  /**
   * 获取复购用户数
   */
  private async getRepeatUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.userId')
      .having('COUNT(*) > 1')
      .getRawMany();

    return result.length;
  }

  /**
   * 获取日期范围
   */
  private getDateRange(query: UserStatisticsQuery): { startDate: Date; endDate: Date } {
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

  /**
   * 获取下一个时间周期
   */
  private getNextPeriod(current: Date, timeRange: TimeRange): Date {
    const next = new Date(current);

    switch (timeRange) {
      case TimeRange.DAY:
        next.setDate(next.getDate() + 1);
        break;
      case TimeRange.WEEK:
        next.setDate(next.getDate() + 7);
        break;
      case TimeRange.MONTH:
        next.setMonth(next.getMonth() + 1);
        break;
      case TimeRange.YEAR:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }
}
