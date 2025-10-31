import { AppDataSource } from '../config/database';
import { CouponDistribution, DistributionType } from '../entities/CouponDistribution';
import { CouponSource } from '../entities/UserCoupon';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserCouponService } from './user-coupon.service';

/**
 * 发放优惠券 DTO
 */
export interface DistributeCouponDTO {
  templateId: string;
  distributionType: DistributionType;
  targetUsers: string[];
  operatorId: string;
  remark?: string;
}

/**
 * 发放记录列表查询 DTO
 */
export interface DistributionListDTO {
  page?: number;
  pageSize?: number;
  templateId?: string;
  distributionType?: DistributionType;
}

/**
 * 优惠券发放服务
 */
export class CouponDistributionService {
  private distributionRepository: Repository<CouponDistribution>;
  private userCouponService: UserCouponService;

  constructor() {
    this.distributionRepository = AppDataSource.getRepository(CouponDistribution);
    this.userCouponService = new UserCouponService();
  }

  /**
   * 发放优惠券
   */
  async distributeCoupons(data: DistributeCouponDTO): Promise<CouponDistribution> {
    const totalCount = data.targetUsers.length;
    let successCount = 0;
    let failCount = 0;

    // 创建发放记录
    const distribution = this.distributionRepository.create({
      id: uuidv4(),
      templateId: data.templateId,
      distributionType: data.distributionType,
      targetUsers: data.targetUsers,
      totalCount,
      successCount: 0,
      failCount: 0,
      operatorId: data.operatorId,
      remark: data.remark,
    });

    await this.distributionRepository.save(distribution);

    // 逐个发放
    for (const userId of data.targetUsers) {
      try {
        await this.userCouponService.issueCoupon(
          data.templateId,
          userId,
          this.getSourceByType(data.distributionType)
        );
        successCount++;
      } catch (error) {
        logger.error(`优惠券发放失败: ${userId} - ${error}`);
        failCount++;
      }
    }

    // 更新发放记录
    distribution.successCount = successCount;
    distribution.failCount = failCount;
    await this.distributionRepository.save(distribution);

    logger.info(
      `优惠券批量发放完成: ${data.templateId} - 成功: ${successCount}, 失败: ${failCount}`
    );
    return distribution;
  }

  /**
   * 获取发放记录列表
   */
  async getDistributionList(query: DistributionListDTO): Promise<{
    list: CouponDistribution[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const queryBuilder = this.distributionRepository
      .createQueryBuilder('distribution')
      .leftJoinAndSelect('distribution.template', 'template');

    // 筛选条件
    if (query.templateId) {
      queryBuilder.andWhere('distribution.templateId = :templateId', {
        templateId: query.templateId,
      });
    }
    if (query.distributionType) {
      queryBuilder.andWhere('distribution.distributionType = :distributionType', {
        distributionType: query.distributionType,
      });
    }

    // 排序和分页
    queryBuilder.orderBy('distribution.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * pageSize);
    queryBuilder.take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 获取发放记录详情
   */
  async getDistributionById(id: string): Promise<CouponDistribution> {
    const distribution = await this.distributionRepository.findOne({
      where: { id },
      relations: ['template'],
    });

    if (!distribution) {
      throw new Error('发放记录不存在');
    }

    return distribution;
  }

  /**
   * 根据发放类型获取券来源
   */
  private getSourceByType(type: DistributionType): CouponSource {
    switch (type) {
      case DistributionType.MANUAL:
        return CouponSource.SYSTEM;
      case DistributionType.BATCH:
        return CouponSource.SYSTEM;
      case DistributionType.ACTIVITY:
        return CouponSource.ACTIVITY;
      default:
        return CouponSource.SYSTEM;
    }
  }
}

