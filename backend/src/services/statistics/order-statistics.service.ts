import { AppDataSource } from '../../config/database';
import { Order, OrderStatus } from '../../entities/Order';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';

/**
 * 时间范围类型
 */
export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * 订单统计查询 DTO
 */
export interface OrderStatisticsQuery {
  timeRange?: TimeRange;
  startDate?: Date;
  endDate?: Date;
  status?: OrderStatus;
  productType?: string;
}

/**
 * 订单统计服务
 */
export class OrderStatisticsService {
  private orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * 获取订单统计
   */
  async getOrderStatistics(query: OrderStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 订单总数
      const totalCount = await this.getOrderCount(startDate, endDate, query.status);

      // 按状态统计
      const byStatus = await this.getOrdersByStatus(startDate, endDate);

      // 订单金额统计
      const amountStats = await this.getOrderAmountStats(startDate, endDate);

      return {
        period: {
          startDate,
          endDate,
        },
        totalCount,
        byStatus,
        amount: amountStats,
      };
    } catch (error: any) {
      logger.error(`获取订单统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单趋势
   */
  async getOrderTrend(query: OrderStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);
      const timeRange = query.timeRange || TimeRange.DAY;

      const trend: any[] = [];
      const current = new Date(startDate);

      while (current < endDate) {
        const periodStart = new Date(current);
        const periodEnd = this.getNextPeriod(current, timeRange);

        const count = await this.getOrderCount(periodStart, periodEnd);

        const orders = await this.orderRepository.find({
          where: {
            created_at: Between(periodStart, periodEnd),
          },
          select: ['totalPrice'],
        });

        const amount = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

        trend.push({
          date: periodStart.toISOString().split('T')[0],
          count,
          amount,
        });

        current.setTime(periodEnd.getTime());
      }

      return trend;
    } catch (error: any) {
      logger.error(`获取订单趋势失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 按产品类型统计订单
   */
  async getOrdersByProduct() {
    try {
      // 注意：当前 Order 表有 orderType 字段
      // 这里返回模拟数据，实际需要根据订单类型统计
      const stats = {
        rv: {
          count: 0,
          amount: 0,
        },
        campsite: {
          count: 0,
          amount: 0,
        },
        tour: {
          count: 0,
          amount: 0,
        },
        specialOffer: {
          count: 0,
          amount: 0,
        },
      };

      // TODO: 实现真实的按产品类型统计逻辑
      // 需要根据订单的 orderType 字段进行分类

      return stats;
    } catch (error: any) {
      logger.error(`按产品类型统计订单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取订单数量
   */
  private async getOrderCount(
    startDate: Date,
    endDate: Date,
    status?: OrderStatus
  ): Promise<number> {
    const where: any = {
      created_at: Between(startDate, endDate),
    };

    if (status) {
      where.status = status;
    }

    return await this.orderRepository.count({ where });
  }

  /**
   * 按状态统计订单
   */
  private async getOrdersByStatus(startDate: Date, endDate: Date) {
    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PICKUP,
      OrderStatus.USING,
      OrderStatus.RETURN,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    const stats: any = {};

    for (const status of statuses) {
      const count = await this.orderRepository.count({
        where: {
          created_at: Between(startDate, endDate),
          status,
        },
      });

      stats[status] = count;
    }

    return stats;
  }

  /**
   * 获取订单金额统计
   */
  private async getOrderAmountStats(startDate: Date, endDate: Date) {
    const orders = await this.orderRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      select: ['totalPrice', 'status'],
    });

    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

    const paidOrders = orders.filter(order => order.status === OrderStatus.PAID);
    const paidAmount = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

    const avgAmount = orders.length > 0 ? totalAmount / orders.length : 0;

    return {
      totalAmount,
      paidAmount,
      avgAmount: Number(avgAmount.toFixed(2)),
    };
  }

  /**
   * 获取日期范围
   */
  private getDateRange(query: OrderStatisticsQuery): { startDate: Date; endDate: Date } {
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
