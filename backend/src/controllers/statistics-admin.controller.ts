import { OverviewStatisticsService } from '../services/statistics/overview-statistics.service';
import { OrderStatisticsService, TimeRange } from '../services/statistics/order-statistics.service';
import { UserStatisticsService } from '../services/statistics/user-statistics.service';
import { RevenueStatisticsService } from '../services/statistics/revenue-statistics.service';
import { VehicleStatisticsService } from '../services/statistics/vehicle-statistics.service';
import { FinanceStatisticsService } from '../services/statistics/finance-statistics.service';

/**
 * 统计管理控制器（管理端）
 */
export class StatisticsAdminController {
  private overviewService: OverviewStatisticsService;
  private orderService: OrderStatisticsService;
  private userService: UserStatisticsService;
  private revenueService: RevenueStatisticsService;
  private vehicleService: VehicleStatisticsService;
  private financeService: FinanceStatisticsService;

  constructor() {
    this.overviewService = new OverviewStatisticsService();
    this.orderService = new OrderStatisticsService();
    this.userService = new UserStatisticsService();
    this.revenueService = new RevenueStatisticsService();
    this.vehicleService = new VehicleStatisticsService();
    this.financeService = new FinanceStatisticsService();
  }

  /**
   * 获取实时数据概览
   */
  async getOverview(ctx: any) {
    try {
      const data = await this.overviewService.getOverview();
      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取订单统计
   */
  async getOrderStatistics(ctx: any) {
    const { timeRange, startDate, endDate, status, productType } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
      status?: string;
      productType?: string;
    };

    try {
      const data = await this.orderService.getOrderStatistics({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as any,
        productType,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取订单趋势
   */
  async getOrderTrend(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.orderService.getOrderTrend({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 按产品类型统计订单
   */
  async getOrdersByProduct(ctx: any) {
    try {
      const data = await this.orderService.getOrdersByProduct();

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取用户统计
   */
  async getUserStatistics(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.userService.getUserStatistics({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取用户增长趋势
   */
  async getUserGrowthTrend(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.userService.getUserGrowthTrend({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehavior(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.userService.getUserBehavior({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取收入统计
   */
  async getRevenueStatistics(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.revenueService.getRevenueStatistics({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取收入趋势
   */
  async getRevenueTrend(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.revenueService.getRevenueTrend({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取车辆统计
   */
  async getVehicleStatistics(ctx: any) {
    try {
      const data = await this.vehicleService.getVehicleStatistics();

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取车辆利用率趋势
   */
  async getVehicleUtilizationTrend(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.vehicleService.getVehicleUtilizationTrend({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取车辆收入排行
   */
  async getVehicleRevenueRanking(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.vehicleService.getVehicleRevenueRanking({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取财务统计
   */
  async getFinanceStatistics(ctx: any) {
    const { timeRange, startDate, endDate } = ctx.query as {
      timeRange?: TimeRange;
      startDate?: string;
      endDate?: string;
    };

    try {
      const data = await this.financeService.getFinanceStatistics({
        timeRange,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取钱包统计
   */
  async getWalletStatistics(ctx: any) {
    try {
      const data = await this.financeService.getWalletStatistics();
      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取提现统计
   */
  async getWithdrawalStatistics(ctx: any) {
    try {
      const data = await this.financeService.getWithdrawalStatistics();

      ctx.success(data, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }
}
