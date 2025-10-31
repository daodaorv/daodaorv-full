import { CouponTemplateService } from '../services/coupon-template.service';
import { UserCouponService } from '../services/user-coupon.service';
import { CouponDistributionService } from '../services/coupon-distribution.service';
import { CouponType, CouponScene } from '../entities/CouponTemplate';
import { DistributionType } from '../entities/CouponDistribution';

/**
 * 优惠券管理控制器（管理端）
 */
export class CouponAdminController {
  private templateService: CouponTemplateService;
  private userCouponService: UserCouponService;
  private distributionService: CouponDistributionService;

  constructor() {
    this.templateService = new CouponTemplateService();
    this.userCouponService = new UserCouponService();
    this.distributionService = new CouponDistributionService();
  }

  /**
   * 创建优惠券模板
   */
  async createTemplate(ctx: any) {
    const data = ctx.request.body as {
      name: string;
      type: CouponType;
      amount?: number;
      discountRate?: number;
      dayCount?: number;
      minAmount?: number;
      scene: CouponScene;
      validDays: number;
      price: number;
      stock?: number;
      limitPerUser?: number;
      canStack: boolean;
      canTransfer: boolean;
      description?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!data.name || !data.type || !data.scene || !data.validDays) {
      ctx.error(400, '必填字段不能为空');
      return;
    }

    try {
      const template = await this.templateService.createTemplate({
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      });

      ctx.success(template, '创建成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 更新优惠券模板
   */
  async updateTemplate(ctx: any) {
    const { id } = ctx.params;
    const data = ctx.request.body as {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      limitPerUser?: number;
      startTime?: string;
      endTime?: string;
    };

    try {
      const template = await this.templateService.updateTemplate(id, {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      });

      ctx.success(template, '更新成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 删除优惠券模板
   */
  async deleteTemplate(ctx: any) {
    const { id } = ctx.params;

    try {
      await this.templateService.deleteTemplate(id);
      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取优惠券模板列表
   */
  async getTemplateList(ctx: any) {
    const { type, scene, isActive, keyword, page, pageSize } = ctx.query;

    const result = await this.templateService.getTemplateList({
      type: type as CouponType,
      scene: scene as CouponScene,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      keyword,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    ctx.success(result, '获取成功');
  }

  /**
   * 获取优惠券模板详情
   */
  async getTemplateDetail(ctx: any) {
    const { id } = ctx.params;

    try {
      const template = await this.templateService.getTemplateById(id);
      ctx.success(template, '获取成功');
    } catch (error: any) {
      ctx.error(404, error.message);
    }
  }

  /**
   * 切换启用状态
   */
  async toggleActive(ctx: any) {
    const { id } = ctx.params;

    try {
      const template = await this.templateService.toggleActive(id);
      ctx.success(template, '操作成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 发放优惠券
   */
  async distributeCoupons(ctx: any) {
    const operatorId = ctx.state.user?.userId;
    const data = ctx.request.body as {
      templateId: string;
      distributionType: DistributionType;
      targetUsers: string[];
      remark?: string;
    };

    if (!data.templateId || !data.distributionType || !data.targetUsers) {
      ctx.error(400, '必填字段不能为空');
      return;
    }

    if (data.targetUsers.length === 0) {
      ctx.error(400, '目标用户列表不能为空');
      return;
    }

    try {
      const distribution = await this.distributionService.distributeCoupons({
        ...data,
        operatorId,
      });

      ctx.success(distribution, '发放成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取发放记录列表
   */
  async getDistributionList(ctx: any) {
    const { templateId, distributionType, page, pageSize } = ctx.query;

    const result = await this.distributionService.getDistributionList({
      templateId,
      distributionType: distributionType as DistributionType,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    ctx.success(result, '获取成功');
  }

  /**
   * 获取优惠券统计数据
   */
  async getStatistics(ctx: any) {
    const { templateId: _templateId } = ctx.query;

    // TODO: 实现真实的统计逻辑
    const statistics = {
      totalIssued: 1000,
      totalUsed: 600,
      totalExpired: 100,
      usageRate: 0.6,
      expiryRate: 0.1,
      averageDiscount: 50,
      totalRevenue: 30000,
    };

    ctx.success(statistics, '获取成功');
  }

  /**
   * 获取用户优惠券列表（管理端查看）
   */
  async getUserCoupons(ctx: any) {
    const { userId, status, scene, page, pageSize } = ctx.query;

    if (!userId) {
      ctx.error(400, '用户 ID 不能为空');
      return;
    }

    const result = await this.userCouponService.getUserCouponList({
      userId,
      status,
      scene,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    ctx.success(result, '获取成功');
  }
}
