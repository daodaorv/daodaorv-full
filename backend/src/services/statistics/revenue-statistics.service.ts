import { AppDataSource } from '../../config/database';
import { Order, OrderStatus } from '../../entities/Order';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';
import { TimeRange } from './order-statistics.service';

/**
 * 收入统计查询 DTO
 */
export interface RevenueStatisticsQuery {
  timeRange?: TimeRange;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 收入统计服务
 */
export class RevenueStatisticsService {
  private orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * 获取收入统计
   */
  async getRevenueStatistics(query: RevenueStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 总收入
      const totalRevenue = await this.getTotalRevenue(startDate, endDate);

      // 退款金额（暂时返回0，需要实现退款表后再统计）
      const totalRefund = 0;

      // 净收入
      const netRevenue = totalRevenue - totalRefund;

      return {
        period: {
          startDate,
          endDate,
        },
        totalRevenue,
        totalRefund,
        netRevenue,
      };
    } catch (error: any) {
      logger.error(`获取收入统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取收入趋势
   */
  async getRevenueTrend(query: RevenueStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);
      const timeRange = query.timeRange || TimeRange.DAY;

      const trend: any[] = [];
      const current = new Date(startDate);

      while (current < endDate) {
        const periodStart = new Date(current);
        const periodEnd = this.getNextPeriod(current, timeRange);

        const revenue = await this.getTotalRevenue(periodStart, periodEnd);
        const refund = 0; // 暂时返回0

        trend.push({
          date: periodStart.toISOString().split('T')[0],
          revenue,
          refund,
          netRevenue: revenue - refund,
        });

        current.setTime(periodEnd.getTime());
      }

      return trend;
    } catch (error: any) {
      logger.error(`获取收入趋势失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取总收入
   */
  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const orders = await this.orderRepository.find({
      where: {
        created_at: Between(startDate, endDate),
        status: OrderStatus.PAID,
      },
      select: ['totalPrice'],
    });

    return orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  }

  /**
   * 获取日期范围
   */
  private getDateRange(query: RevenueStatisticsQuery): { startDate: Date; endDate: Date } {
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
