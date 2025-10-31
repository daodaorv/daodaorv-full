import { AppDataSource } from '../config/database';
import { CouponTemplate, CouponType, CouponScene } from '../entities/CouponTemplate';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

/**
 * 创建优惠券模板 DTO
 */
export interface CreateCouponTemplateDTO {
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
  startTime?: Date;
  endTime?: Date;
}

/**
 * 更新优惠券模板 DTO
 */
export interface UpdateCouponTemplateDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  limitPerUser?: number;
  startTime?: Date;
  endTime?: Date;
}

/**
 * 优惠券模板列表查询 DTO
 */
export interface CouponTemplateListDTO {
  page?: number;
  pageSize?: number;
  type?: CouponType;
  scene?: CouponScene;
  isActive?: boolean;
  keyword?: string;
}

/**
 * 优惠券模板服务
 */
export class CouponTemplateService {
  private templateRepository: Repository<CouponTemplate>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(CouponTemplate);
  }

  /**
   * 创建优惠券模板
   */
  async createTemplate(data: CreateCouponTemplateDTO): Promise<CouponTemplate> {
    // 验证券类型和对应字段
    this.validateTemplateData(data);

    const template = this.templateRepository.create({
      name: data.name,
      type: data.type,
      amount: data.amount,
      discountRate: data.discountRate,
      dayCount: data.dayCount,
      minAmount: data.minAmount,
      scene: data.scene,
      validDays: data.validDays,
      price: data.price,
      stock: data.stock,
      limitPerUser: data.limitPerUser,
      canStack: data.canStack,
      canTransfer: data.canTransfer,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: true,
    });

    await this.templateRepository.save(template);
    logger.info(`优惠券模板创建成功: ${template.name} (${template.id})`);
    return template;
  }

  /**
   * 更新优惠券模板
   */
  async updateTemplate(
    id: string,
    data: UpdateCouponTemplateDTO
  ): Promise<CouponTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    // 只允许更新部分字段（券类型和核心规则不可修改）
    if (data.name !== undefined) template.name = data.name;
    if (data.description !== undefined) template.description = data.description;
    if (data.price !== undefined) template.price = data.price;
    if (data.stock !== undefined) template.stock = data.stock;
    if (data.limitPerUser !== undefined) template.limitPerUser = data.limitPerUser;
    if (data.startTime !== undefined) template.startTime = data.startTime;
    if (data.endTime !== undefined) template.endTime = data.endTime;

    await this.templateRepository.save(template);
    logger.info(`优惠券模板更新成功: ${template.id}`);
    return template;
  }

  /**
   * 删除优惠券模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    // 检查是否有已发放的券
    const issuedCount = await AppDataSource.getRepository('UserCoupon').count({
      where: { templateId: id },
    });

    if (issuedCount > 0) {
      throw new Error('该模板已有发放记录，不可删除');
    }

    await this.templateRepository.remove(template);
    logger.info(`优惠券模板删除成功: ${id}`);
  }

  /**
   * 切换启用状态
   */
  async toggleActive(id: string): Promise<CouponTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    template.isActive = !template.isActive;
    await this.templateRepository.save(template);
    logger.info(`优惠券模板状态切换: ${id} -> ${template.isActive ? '启用' : '禁用'}`);
    return template;
  }

  /**
   * 获取优惠券模板列表
   */
  async getTemplateList(query: CouponTemplateListDTO): Promise<{
    list: CouponTemplate[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    // 筛选条件
    if (query.type) {
      queryBuilder.andWhere('template.type = :type', { type: query.type });
    }
    if (query.scene) {
      queryBuilder.andWhere('template.scene = :scene', { scene: query.scene });
    }
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('template.isActive = :isActive', {
        isActive: query.isActive,
      });
    }
    if (query.keyword) {
      queryBuilder.andWhere('template.name LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    // 排序和分页
    queryBuilder.orderBy('template.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * pageSize);
    queryBuilder.take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 获取优惠券模板详情
   */
  async getTemplateById(id: string): Promise<CouponTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }
    return template;
  }

  /**
   * 扣减库存
   */
  async decreaseStock(id: string, count: number): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    if (template.stock !== null && template.stock !== undefined) {
      if (template.stock < count) {
        throw new Error('库存不足');
      }
      template.stock -= count;
      await this.templateRepository.save(template);
      logger.info(`优惠券库存扣减: ${id} - ${count}`);
    }
  }

  /**
   * 增加库存（退款时）
   */
  async increaseStock(id: string, count: number): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    if (template.stock !== null && template.stock !== undefined) {
      template.stock += count;
      await this.templateRepository.save(template);
      logger.info(`优惠券库存增加: ${id} + ${count}`);
    }
  }

  /**
   * 验证模板数据
   */
  private validateTemplateData(data: CreateCouponTemplateDTO): void {
    // 现金券必须设置面额
    if (data.type === CouponType.CASH && !data.amount) {
      throw new Error('现金券必须设置面额');
    }

    // 折扣券必须设置折扣率
    if (data.type === CouponType.DISCOUNT && !data.discountRate) {
      throw new Error('折扣券必须设置折扣率');
    }

    // 折扣率必须在 0-1 之间
    if (data.discountRate && (data.discountRate <= 0 || data.discountRate >= 1)) {
      throw new Error('折扣率必须在 0-1 之间');
    }

    // 满减券必须设置面额和最低消费金额
    if (data.type === CouponType.FULL_REDUCTION) {
      if (!data.amount) {
        throw new Error('满减券必须设置面额');
      }
      if (!data.minAmount) {
        throw new Error('满减券必须设置最低消费金额');
      }
    }

    // 日租抵扣券必须设置抵扣天数
    if (data.type === CouponType.DAY_DEDUCTION && !data.dayCount) {
      throw new Error('日租抵扣券必须设置抵扣天数');
    }

    // 有效天数必须 > 0
    if (data.validDays <= 0) {
      throw new Error('有效天数必须大于 0');
    }
  }
}

