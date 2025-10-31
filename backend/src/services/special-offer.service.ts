import { AppDataSource } from '../config/database';
import { SpecialOffer, SpecialOfferStatus } from '../entities/SpecialOffer';
import { SpecialOfferBooking } from '../entities/SpecialOfferBooking';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSpecialOfferDTO {
  name: string;
  pickupCity: string;
  returnCity: string;
  fixedDays: number;
  originalPrice: number;
  offerPrice: number;
  vehicleModelIds: string[];
  startDate: Date;
  endDate: Date;
  totalStock: number;
  description?: string;
  highlights?: string[];
  includedServices?: string[];
  excludedServices?: string[];
  coverImage?: string;
  images?: string[];
}

export interface UpdateSpecialOfferDTO {
  name?: string;
  pickupCity?: string;
  returnCity?: string;
  fixedDays?: number;
  originalPrice?: number;
  offerPrice?: number;
  vehicleModelIds?: string[];
  startDate?: Date;
  endDate?: Date;
  totalStock?: number;
  description?: string;
  highlights?: string[];
  includedServices?: string[];
  excludedServices?: string[];
  coverImage?: string;
  images?: string[];
}

export interface SpecialOfferListDTO {
  page?: number;
  pageSize?: number;
  pickupCity?: string;
  returnCity?: string;
  status?: SpecialOfferStatus;
  keyword?: string;
  sortBy?: 'createdAt' | 'offerPrice' | 'startDate';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 特惠套餐服务
 */
export class SpecialOfferService {
  private offerRepository = AppDataSource.getRepository(SpecialOffer);
  private bookingRepository = AppDataSource.getRepository(SpecialOfferBooking);

  /**
   * 创建特惠套餐
   */
  async createOffer(data: CreateSpecialOfferDTO): Promise<SpecialOffer> {
    try {
      // 验证业务规则
      if (data.offerPrice >= data.originalPrice) {
        throw new Error('特惠价必须低于原价');
      }

      if (new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error('活动结束日期必须晚于开始日期');
      }

      if (data.fixedDays < 2 || data.fixedDays > 30) {
        throw new Error('固定租期必须在 2-30 天之间');
      }

      if (data.totalStock <= 0) {
        throw new Error('总库存必须大于 0');
      }

      // 创建套餐记录（默认为草稿状态）
      const offer = this.offerRepository.create({
        id: uuidv4(),
        name: data.name,
        pickupCity: data.pickupCity,
        returnCity: data.returnCity,
        fixedDays: data.fixedDays,
        originalPrice: data.originalPrice,
        offerPrice: data.offerPrice,
        vehicleModelIds: data.vehicleModelIds,
        startDate: data.startDate,
        endDate: data.endDate,
        totalStock: data.totalStock,
        remainingStock: data.totalStock,
        description: data.description,
        highlights: data.highlights,
        includedServices: data.includedServices,
        excludedServices: data.excludedServices,
        coverImage: data.coverImage,
        images: data.images,
        status: SpecialOfferStatus.DRAFT,
      });

      await this.offerRepository.save(offer);

      logger.info(`特惠套餐创建成功: ${offer.id} - ${offer.name}`);
      return offer;
    } catch (error) {
      logger.error('创建特惠套餐失败:', error);
      throw error;
    }
  }

  /**
   * 更新特惠套餐
   */
  async updateOffer(id: string, data: UpdateSpecialOfferDTO): Promise<SpecialOffer> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      // 如果套餐已启用且有订单，不允许修改关键字段
      if (offer.status === SpecialOfferStatus.ACTIVE) {
        const bookingCount = await this.bookingRepository.count({
          where: { offerId: id },
        });

        if (bookingCount > 0) {
          // 有订单时，不允许修改价格、租期等关键字段
          if (
            data.offerPrice !== undefined ||
            data.fixedDays !== undefined ||
            data.startDate !== undefined ||
            data.endDate !== undefined
          ) {
            throw new Error('套餐已有订单，无法修改价格、租期和活动时间');
          }
        }
      }

      // 验证业务规则
      if (data.offerPrice !== undefined && data.originalPrice !== undefined) {
        if (data.offerPrice >= data.originalPrice) {
          throw new Error('特惠价必须低于原价');
        }
      } else if (data.offerPrice !== undefined && data.offerPrice >= offer.originalPrice) {
        throw new Error('特惠价必须低于原价');
      } else if (data.originalPrice !== undefined && offer.offerPrice >= data.originalPrice) {
        throw new Error('特惠价必须低于原价');
      }

      if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error('活动结束日期必须晚于开始日期');
      }

      if (data.fixedDays !== undefined && (data.fixedDays < 2 || data.fixedDays > 30)) {
        throw new Error('固定租期必须在 2-30 天之间');
      }

      // 更新字段
      Object.assign(offer, data);

      // 如果更新了总库存，同步更新剩余库存
      if (data.totalStock !== undefined) {
        const bookedCount = offer.totalStock - offer.remainingStock;
        offer.remainingStock = data.totalStock - bookedCount;
        if (offer.remainingStock < 0) {
          throw new Error('总库存不能小于已预订数量');
        }
      }

      await this.offerRepository.save(offer);

      logger.info(`特惠套餐更新成功: ${id}`);
      return offer;
    } catch (error) {
      logger.error('更新特惠套餐失败:', error);
      throw error;
    }
  }

  /**
   * 切换套餐状态
   */
  async switchStatus(id: string, status: SpecialOfferStatus): Promise<SpecialOffer> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      // 启用套餐时的验证
      if (status === SpecialOfferStatus.ACTIVE) {
        if (!offer.coverImage) {
          throw new Error('启用套餐前必须上传封面图');
        }
        if (offer.remainingStock <= 0) {
          throw new Error('库存不足，无法启用套餐');
        }
        if (new Date(offer.endDate) < new Date()) {
          throw new Error('活动已过期，无法启用套餐');
        }
      }

      offer.status = status;
      await this.offerRepository.save(offer);

      logger.info(`特惠套餐状态切换成功: ${offer.id} -> ${status}`);
      return offer;
    } catch (error) {
      logger.error('切换特惠套餐状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取套餐列表
   */
  async getOfferList(params: SpecialOfferListDTO): Promise<{
    offers: SpecialOffer[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        pickupCity,
        returnCity,
        status,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = params;

      const queryBuilder = this.offerRepository.createQueryBuilder('offer');

      // 筛选条件
      if (pickupCity) {
        queryBuilder.andWhere('offer.pickupCity = :pickupCity', { pickupCity });
      }

      if (returnCity) {
        queryBuilder.andWhere('offer.returnCity = :returnCity', { returnCity });
      }

      if (status) {
        queryBuilder.andWhere('offer.status = :status', { status });
      }

      if (keyword) {
        queryBuilder.andWhere('(offer.name LIKE :keyword OR offer.description LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }

      // 排序
      queryBuilder.orderBy(`offer.${sortBy}`, sortOrder);

      // 分页
      const [offers, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      logger.info(`获取特惠套餐列表成功: ${offers.length}/${total}`);
      return { offers, total, page, pageSize };
    } catch (error) {
      logger.error('获取特惠套餐列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取套餐详情
   */
  async getOfferById(id: string): Promise<SpecialOffer> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      logger.info(`获取特惠套餐详情成功: ${offer.id}`);
      return offer;
    } catch (error) {
      logger.error('获取特惠套餐详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除套餐
   */
  async deleteOffer(id: string): Promise<void> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      // 检查是否有未完成的订单
      const pendingBookings = await this.bookingRepository.count({
        where: { offerId: id },
      });

      if (pendingBookings > 0) {
        throw new Error('该套餐还有订单，无法删除');
      }

      await this.offerRepository.remove(offer);

      logger.info(`特惠套餐删除成功: ${id}`);
    } catch (error) {
      logger.error('删除特惠套餐失败:', error);
      throw error;
    }
  }

  /**
   * 扣减库存
   */
  async decreaseStock(id: string, quantity: number = 1): Promise<void> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      if (offer.remainingStock < quantity) {
        throw new Error('库存不足');
      }

      offer.remainingStock -= quantity;
      await this.offerRepository.save(offer);

      logger.info(`特惠套餐库存扣减成功: ${id}, 扣减数量: ${quantity}, 剩余: ${offer.remainingStock}`);
    } catch (error) {
      logger.error('扣减特惠套餐库存失败:', error);
      throw error;
    }
  }

  /**
   * 恢复库存
   */
  async increaseStock(id: string, quantity: number = 1): Promise<void> {
    try {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      offer.remainingStock += quantity;
      if (offer.remainingStock > offer.totalStock) {
        offer.remainingStock = offer.totalStock;
      }

      await this.offerRepository.save(offer);

      logger.info(`特惠套餐库存恢复成功: ${id}, 恢复数量: ${quantity}, 剩余: ${offer.remainingStock}`);
    } catch (error) {
      logger.error('恢复特惠套餐库存失败:', error);
      throw error;
    }
  }
}

