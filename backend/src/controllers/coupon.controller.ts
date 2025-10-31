import { CouponTemplateService } from '../services/coupon-template.service';
import { UserCouponService } from '../services/user-coupon.service';
import { CouponStatus } from '../entities/UserCoupon';

/**
 * 优惠券控制器（用户端）
 */
export class CouponController {
  private templateService: CouponTemplateService;
  private userCouponService: UserCouponService;

  constructor() {
    this.templateService = new CouponTemplateService();
    this.userCouponService = new UserCouponService();
  }

  /**
   * 获取可购买的优惠券列表
   */
  async getTemplateList(ctx: any) {
    const { type, scene, keyword, page, pageSize } = ctx.query;

    const result = await this.templateService.getTemplateList({
      type,
      scene,
      isActive: true, // 只显示启用的
      keyword,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    ctx.success(result, '获取成功');
  }

  /**
   * 购买优惠券
   */
  async purchaseCoupon(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { templateId, count } = ctx.request.body as {
      templateId: string;
      count: number;
    };

    if (!templateId) {
      ctx.error(400, '优惠券模板 ID 不能为空');
      return;
    }

    if (!count || count <= 0) {
      ctx.error(400, '购买数量必须大于 0');
      return;
    }

    try {
      const coupons = await this.userCouponService.purchaseCoupon({
        templateId,
        userId,
        count,
      });

      ctx.success(coupons, '购买成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取我的优惠券列表
   */
  async getMyCoupons(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { status, scene, page, pageSize } = ctx.query;

    const result = await this.userCouponService.getUserCouponList({
      userId,
      status: status as CouponStatus,
      scene,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    ctx.success(result, '获取成功');
  }

  /**
   * 获取优惠券详情
   */
  async getCouponDetail(ctx: any) {
    const { id } = ctx.params;

    try {
      const coupon = await this.userCouponService.getUserCouponList({
        userId: ctx.state.user?.userId,
        page: 1,
        pageSize: 1,
      });

      const found = coupon.list.find((c) => c.id === id);
      if (!found) {
        ctx.error(404, '优惠券不存在');
        return;
      }

      ctx.success(found, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 转赠优惠券
   */
  async transferCoupon(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;
    const { toUserId } = ctx.request.body as { toUserId: string };

    if (!toUserId) {
      ctx.error(400, '接收人 ID 不能为空');
      return;
    }

    if (toUserId === userId) {
      ctx.error(400, '不能转赠给自己');
      return;
    }

    try {
      const newCoupon = await this.userCouponService.transferCoupon({
        couponId: id,
        fromUserId: userId,
        toUserId,
      });

      ctx.success(newCoupon, '转赠成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取可用优惠券（下单时）
   */
  async getAvailableCoupons(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { scene, orderAmount } = ctx.query;

    if (!scene) {
      ctx.error(400, '适用场景不能为空');
      return;
    }

    if (!orderAmount) {
      ctx.error(400, '订单金额不能为空');
      return;
    }

    const coupons = await this.userCouponService.getAvailableCoupons({
      userId,
      scene,
      orderAmount: parseFloat(orderAmount),
    });

    ctx.success(coupons, '获取成功');
  }
}

