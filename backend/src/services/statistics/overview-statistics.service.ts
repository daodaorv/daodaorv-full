import { AppDataSource } from '../../config/database';
import { Order, OrderStatus } from '../../entities/Order';
import { User } from '../../entities/User';
import { Vehicle, VehicleStatus } from '../../entities/Vehicle';
import { logger } from '../../utils/logger';
import { Repository, Between } from 'typeorm';

/**
 * 实时数据概览服务
 */
export class OverviewStatisticsService {
  private orderRepository: Repository<Order>;
  private userRepository: Repository<User>;
  private vehicleRepository: Repository<Vehicle>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.userRepository = AppDataSource.getRepository(User);
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
  }

  /**
   * 获取实时数据概览
   */
  async getOverview() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 今日订单统计
      const todayOrders = await this.getTodayOrders(today, tomorrow);

      // 今日用户统计
      const todayUsers = await this.getTodayUsers(today, tomorrow);

      // 今日收入统计
      const todayRevenue = await this.getTodayRevenue(today, tomorrow);

      // 车辆利用率
      const vehicleUtilization = await this.getVehicleUtilization();

      // 总体统计
      const totalStats = await this.getTotalStats();

      return {
        today: {
          orders: todayOrders,
          users: todayUsers,
          revenue: todayRevenue,
        },
        vehicle: vehicleUtilization,
        total: totalStats,
      };
    } catch (error: any) {
      logger.error(`获取实时数据概览失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取今日订单统计
   */
  private async getTodayOrders(today: Date, tomorrow: Date) {
    const count = await this.orderRepository.count({
      where: {
        created_at: Between(today, tomorrow),
      },
    });

    const paidCount = await this.orderRepository.count({
      where: {
        created_at: Between(today, tomorrow),
        status: OrderStatus.PAID,
      },
    });

    const completedCount = await this.orderRepository.count({
      where: {
        created_at: Between(today, tomorrow),
        status: OrderStatus.COMPLETED,
      },
    });

    // 计算今日订单总金额
    const orders = await this.orderRepository.find({
      where: {
        created_at: Between(today, tomorrow),
      },
      select: ['totalPrice'],
    });

    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

    return {
      count,
      paidCount,
      completedCount,
      totalAmount,
    };
  }

  /**
   * 获取今日用户统计
   */
  private async getTodayUsers(today: Date, tomorrow: Date) {
    const newUsers = await this.userRepository.count({
      where: {
        created_at: Between(today, tomorrow),
      },
    });

    return {
      newUsers,
    };
  }

  /**
   * 获取今日收入统计
   */
  private async getTodayRevenue(today: Date, tomorrow: Date) {
    // 查询今日已支付的订单
    const paidOrders = await this.orderRepository.find({
      where: {
        created_at: Between(today, tomorrow),
        status: OrderStatus.PAID,
      },
      select: ['totalPrice'],
    });

    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

    // 计算昨日收入用于环比
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayOrders = await this.orderRepository.find({
      where: {
        created_at: Between(yesterday, today),
        status: OrderStatus.PAID,
      },
      select: ['totalPrice'],
    });

    const yesterdayRevenue = yesterdayOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0
    );

    // 计算环比增长率
    const growthRate =
      yesterdayRevenue > 0 ? ((revenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    return {
      revenue,
      yesterdayRevenue,
      growthRate: Number(growthRate.toFixed(2)),
    };
  }

  /**
   * 获取车辆利用率
   */
  private async getVehicleUtilization() {
    const totalVehicles = await this.vehicleRepository.count();

    const availableVehicles = await this.vehicleRepository.count({
      where: {
        status: VehicleStatus.AVAILABLE,
      },
    });

    // 计算正在使用的车辆数（状态为使用中的订单）
    const inUseOrders = await this.orderRepository.count({
      where: {
        status: OrderStatus.USING,
      },
    });

    const utilizationRate = totalVehicles > 0 ? (inUseOrders / totalVehicles) * 100 : 0;

    return {
      total: totalVehicles,
      available: availableVehicles,
      inUse: inUseOrders,
      utilizationRate: Number(utilizationRate.toFixed(2)),
    };
  }

  /**
   * 获取总体统计
   */
  private async getTotalStats() {
    const totalUsers = await this.userRepository.count();
    const totalOrders = await this.orderRepository.count();
    const totalVehicles = await this.vehicleRepository.count();

    // 计算总收入
    const allPaidOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAID,
      },
      select: ['totalPrice'],
    });

    const totalRevenue = allPaidOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

    return {
      totalUsers,
      totalOrders,
      totalVehicles,
      totalRevenue,
    };
  }
}
