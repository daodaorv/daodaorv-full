import { AppDataSource } from '../../config/database';
import { Vehicle, VehicleStatus } from '../../entities/Vehicle';
import { Order, OrderStatus } from '../../entities/Order';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';
import { TimeRange } from './order-statistics.service';

/**
 * 车辆统计查询 DTO
 */
export interface VehicleStatisticsQuery {
  timeRange?: TimeRange;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 车辆统计服务
 */
export class VehicleStatisticsService {
  private vehicleRepository: Repository<Vehicle>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * 获取车辆统计
   */
  async getVehicleStatistics() {
    try {
      // 车辆总数
      const totalVehicles = await this.vehicleRepository.count();

      // 可用车辆数
      const availableVehicles = await this.vehicleRepository.count({
        where: {
          status: VehicleStatus.AVAILABLE,
        },
      });

      // 维护中车辆数
      const maintenanceVehicles = await this.vehicleRepository.count({
        where: {
          status: VehicleStatus.MAINTENANCE,
        },
      });

      // 使用中车辆数
      const inUseVehicles = await this.orderRepository.count({
        where: {
          status: OrderStatus.USING,
        },
      });

      // 车辆利用率
      const utilizationRate = totalVehicles > 0 ? (inUseVehicles / totalVehicles) * 100 : 0;

      return {
        totalVehicles,
        availableVehicles,
        maintenanceVehicles,
        inUseVehicles,
        utilizationRate: Number(utilizationRate.toFixed(2)),
      };
    } catch (error: any) {
      logger.error(`获取车辆统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取车辆利用率趋势
   */
  async getVehicleUtilizationTrend(query: VehicleStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);
      const timeRange = query.timeRange || TimeRange.DAY;

      const trend: any[] = [];
      const current = new Date(startDate);

      while (current < endDate) {
        const periodStart = new Date(current);
        const periodEnd = this.getNextPeriod(current, timeRange);

        // 该时间段内使用中的订单数
        const inUseOrders = await this.orderRepository.count({
          where: {
            created_at: Between(periodStart, periodEnd),
            status: OrderStatus.USING,
          },
        });

        // 总车辆数（假设不变）
        const totalVehicles = await this.vehicleRepository.count();

        const utilizationRate = totalVehicles > 0 ? (inUseOrders / totalVehicles) * 100 : 0;

        trend.push({
          date: periodStart.toISOString().split('T')[0],
          inUseVehicles: inUseOrders,
          totalVehicles,
          utilizationRate: Number(utilizationRate.toFixed(2)),
        });

        current.setTime(periodEnd.getTime());
      }

      return trend;
    } catch (error: any) {
      logger.error(`获取车辆利用率趋势失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取车辆收入排行
   */
  async getVehicleRevenueRanking(query: VehicleStatisticsQuery) {
    try {
      const { startDate, endDate } = this.getDateRange(query);

      // 按车辆统计订单收入
      const result = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.vehicleId', 'vehicleId')
        .addSelect('COUNT(*)', 'orderCount')
        .addSelect('SUM(order.totalAmount)', 'totalRevenue')
        .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('order.status = :status', { status: OrderStatus.PAID })
        .groupBy('order.vehicleId')
        .orderBy('totalRevenue', 'DESC')
        .limit(10)
        .getRawMany();

      // 获取车辆信息
      const ranking = await Promise.all(
        result.map(async item => {
          const vehicle = await this.vehicleRepository.findOne({
            where: { id: item.vehicleId },
            select: ['id', 'licensePlate'],
            relations: ['vehicleModel'],
          });

          return {
            vehicleId: item.vehicleId,
            vehicle,
            orderCount: parseInt(item.orderCount),
            totalRevenue: Number(item.totalRevenue),
          };
        })
      );

      return ranking;
    } catch (error: any) {
      logger.error(`获取车辆收入排行失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取日期范围
   */
  private getDateRange(query: VehicleStatisticsQuery): { startDate: Date; endDate: Date } {
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
