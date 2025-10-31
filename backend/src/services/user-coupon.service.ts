import { AppDataSource } from '../config/database';
import { UserCoupon, CouponSource, CouponStatus } from '../entities/UserCoupon';
import { logger } from '../utils/logger';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CouponTemplateService } from './coupon-template.service';

/**
 * 购买优惠券 DTO
 */
export interface PurchaseCouponDTO {
  templateId: string;
  userId: string;
  count: number;
}

/**
 * 转赠优惠券 DTO
 */
export interface TransferCouponDTO {
  couponId: string;
  fromUserId: string;
  toUserId: string;
}

/**
 * 用户优惠券列表查询 DTO
 */
export interface UserCouponListDTO {
  userId: string;
  status?: CouponStatus;
  scene?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 获取可用优惠券 DTO
 */
export interface AvailableCouponDTO {
  userId: string;
  scene: string;
  orderAmount: number;
}

/**
 * 用户优惠券服务
 */
export class UserCouponService {
  private couponRepository: Repository<UserCoupon>;
  private templateService: CouponTemplateService;

  constructor() {
    this.couponRepository = AppDataSource.getRepository(UserCoupon);
    this.templateService = new CouponTemplateService();
  }

  /**
   * 生成优惠券编号
   */
  private async generateCouponNo(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CPN${timestamp}${random}`;
  }

  /**
   * 购买优惠券
   */
  async purchaseCoupon(data: PurchaseCouponDTO): Promise<UserCoupon[]> {
    const template = await this.templateService.getTemplateById(data.templateId);

    // 验证模板状态
    if (!template.isActive) {
      throw new Error('该优惠券已下架');
    }

    // 验证时间范围
    const now = new Date();
    if (template.startTime && now < template.startTime) {
      throw new Error('该优惠券尚未开始发售');
    }
    if (template.endTime && now > template.endTime) {
      throw new Error('该优惠券已停止发售');
    }

    // 验证库存
    if (template.stock !== null && template.stock !== undefined) {
      if (template.stock < data.count) {
        throw new Error('库存不足');
      }
    }

    // 验证每人限购数量
    if (template.limitPerUser) {
      const purchasedCount = await this.couponRepository.count({
        where: {
          templateId: data.templateId,
          userId: data.userId,
          source: CouponSource.PURCHASE,
        },
      });

      if (purchasedCount + data.count > template.limitPerUser) {
        throw new Error(`每人限购 ${template.limitPerUser} 张`);
      }
    }

    // 扣减库存
    await this.templateService.decreaseStock(data.templateId, data.count);

    // 创建用户优惠券
    const coupons: UserCoupon[] = [];
    const receivedAt = new Date();
    const expireAt = new Date(receivedAt.getTime() + template.validDays * 24 * 60 * 60 * 1000);

    for (let i = 0; i < data.count; i++) {
      const coupon = this.couponRepository.create({
        id: uuidv4(),
        couponNo: await this.generateCouponNo(),
        templateId: data.templateId,
        userId: data.userId,
        source: CouponSource.PURCHASE,
        status: CouponStatus.UNUSED,
        receivedAt,
        expireAt,
      });

      await this.couponRepository.save(coupon);
      coupons.push(coupon);
    }

    logger.info(`用户购买优惠券成功: ${data.userId} - ${data.templateId} × ${data.count}`);
    return coupons;
  }

  /**
   * 发放优惠券（系统/活动）
   */
  async issueCoupon(templateId: string, userId: string, source: CouponSource): Promise<UserCoupon> {
    const template = await this.templateService.getTemplateById(templateId);

    const receivedAt = new Date();
    const expireAt = new Date(receivedAt.getTime() + template.validDays * 24 * 60 * 60 * 1000);

    const coupon = this.couponRepository.create({
      id: uuidv4(),
      couponNo: await this.generateCouponNo(),
      templateId,
      userId,
      source,
      status: CouponStatus.UNUSED,
      receivedAt,
      expireAt,
    });

    await this.couponRepository.save(coupon);
    logger.info(`优惠券发放成功: ${userId} - ${templateId} (${source})`);
    return coupon;
  }

  /**
   * 转赠优惠券
   */
  async transferCoupon(data: TransferCouponDTO): Promise<UserCoupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id: data.couponId },
      relations: ['template'],
    });

    if (!coupon) {
      throw new Error('优惠券不存在');
    }

    // 验证持有人
    if (coupon.userId !== data.fromUserId) {
      throw new Error('您不是该优惠券的持有人');
    }

    // 验证状态
    if (coupon.status !== CouponStatus.UNUSED) {
      throw new Error('该优惠券不可转赠');
    }

    // 验证是否过期
    if (new Date() > coupon.expireAt) {
      throw new Error('该优惠券已过期');
    }

    // 验证是否可转赠
    if (!coupon.template?.canTransfer) {
      throw new Error('该优惠券不支持转赠');
    }

    // 验证是否已转赠过
    if (coupon.originalOwner) {
      throw new Error('该优惠券已转赠过，不可再次转赠');
    }

    // 更新原券状态为已转赠
    coupon.status = CouponStatus.TRANSFERRED;
    coupon.transferredTo = data.toUserId;
    coupon.transferredAt = new Date();
    await this.couponRepository.save(coupon);

    // 创建新券给接收人
    const newCoupon = this.couponRepository.create({
      id: uuidv4(),
      couponNo: await this.generateCouponNo(),
      templateId: coupon.templateId,
      userId: data.toUserId,
      source: CouponSource.GIFT,
      status: CouponStatus.UNUSED,
      receivedAt: new Date(),
      expireAt: coupon.expireAt, // 有效期不变
      originalOwner: data.fromUserId, // 记录原始持有人
    });

    await this.couponRepository.save(newCoupon);
    logger.info(`优惠券转赠成功: ${data.fromUserId} -> ${data.toUserId} (${data.couponId})`);
    return newCoupon;
  }

  /**
   * 使用优惠券
   */
  async useCoupon(couponId: string, orderId: string, orderType: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error('优惠券不存在');
    }

    if (coupon.status !== CouponStatus.UNUSED) {
      throw new Error('该优惠券不可使用');
    }

    if (new Date() > coupon.expireAt) {
      throw new Error('该优惠券已过期');
    }

    coupon.status = CouponStatus.USED;
    coupon.usedAt = new Date();
    coupon.orderId = orderId;
    coupon.orderType = orderType;

    await this.couponRepository.save(coupon);
    logger.info(`优惠券使用成功: ${couponId} - 订单: ${orderId}`);
  }

  /**
   * 退券（订单退款时）
   */
  async refundCoupon(couponId: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error('优惠券不存在');
    }

    if (coupon.status !== CouponStatus.USED) {
      throw new Error('该优惠券未使用，无需退回');
    }

    // 检查是否过期
    if (new Date() > coupon.expireAt) {
      logger.info(`优惠券已过期，不退回: ${couponId}`);
      return;
    }

    coupon.status = CouponStatus.UNUSED;
    coupon.usedAt = undefined;
    coupon.orderId = undefined;
    coupon.orderType = undefined;

    await this.couponRepository.save(coupon);
    logger.info(`优惠券退回成功: ${couponId}`);
  }

  /**
   * 获取用户优惠券列表
   */
  async getUserCouponList(query: UserCouponListDTO): Promise<{
    list: UserCoupon[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const queryBuilder = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.template', 'template')
      .where('coupon.userId = :userId', { userId: query.userId });

    // 筛选条件
    if (query.status) {
      queryBuilder.andWhere('coupon.status = :status', { status: query.status });
    }
    if (query.scene) {
      queryBuilder.andWhere('template.scene = :scene OR template.scene = :all', {
        scene: query.scene,
        all: 'all',
      });
    }

    // 排序和分页
    queryBuilder.orderBy('coupon.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * pageSize);
    queryBuilder.take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 获取可用优惠券（下单时）
   */
  async getAvailableCoupons(query: AvailableCouponDTO): Promise<UserCoupon[]> {
    const coupons = await this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.template', 'template')
      .where('coupon.userId = :userId', { userId: query.userId })
      .andWhere('coupon.status = :status', { status: CouponStatus.UNUSED })
      .andWhere('coupon.expireAt > :now', { now: new Date() })
      .andWhere('(template.scene = :scene OR template.scene = :all)', {
        scene: query.scene,
        all: 'all',
      })
      .getMany();

    // 过滤满足最低消费金额的券
    return coupons.filter(coupon => {
      if (coupon.template?.minAmount) {
        return query.orderAmount >= coupon.template.minAmount;
      }
      return true;
    });
  }

  /**
   * 自动过期优惠券（定时任务）
   */
  async expireCoupons(): Promise<number> {
    const result = await this.couponRepository.update(
      {
        status: CouponStatus.UNUSED,
        expireAt: LessThan(new Date()),
      },
      {
        status: CouponStatus.EXPIRED,
      }
    );

    logger.info(`自动过期优惠券: ${result.affected} 张`);
    return result.affected || 0;
  }
}
