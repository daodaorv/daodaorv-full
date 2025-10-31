import { AppDataSource } from '../config/database';
import {
  TourRoute,
  TourDestination,
  ServiceMode,
  TourStatus,
  BookingMode,
} from '../entities/TourRoute';
import { TourBatch, BatchStatus } from '../entities/TourBatch';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 旅游路线DTO接口
 */
export interface CreateTourRouteDTO {
  name: string;
  summary: string;
  destination: TourDestination;
  days: number;
  nights: number;
  itinerary: any[]; // [{day: 1, title: '', content: '', meals: '', accommodation: ''}]
  included: string[];
  excluded: string[];
  adultPrice: number;
  childPrice: number;
  serviceMode: ServiceMode;
  butlerFeePerDay?: number;
  minParticipants?: number;
  maxParticipants?: number;
  coverImage?: string;
  images?: string[];
  bookingMode?: BookingMode;
  customerServicePhone?: string;
}

export interface UpdateTourRouteDTO {
  name?: string;
  summary?: string;
  destination?: TourDestination;
  days?: number;
  nights?: number;
  itinerary?: any[];
  included?: string[];
  excluded?: string[];
  adultPrice?: number;
  childPrice?: number;
  serviceMode?: ServiceMode;
  butlerFeePerDay?: number;
  minParticipants?: number;
  maxParticipants?: number;
  coverImage?: string;
  images?: string[];
  bookingMode?: BookingMode;
  customerServicePhone?: string;
}

export interface TourRouteListDTO {
  page?: number;
  pageSize?: number;
  destination?: TourDestination;
  minDays?: number;
  maxDays?: number;
  minPrice?: number;
  maxPrice?: number;
  status?: TourStatus;
  keyword?: string;
  sortBy?: 'createdAt' | 'averageRating' | 'salesCount' | 'adultPrice';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 旅游路线服务
 */
export class TourRouteService {
  private routeRepository = AppDataSource.getRepository(TourRoute);
  private batchRepository = AppDataSource.getRepository(TourBatch);

  /**
   * 创建旅游路线
   */
  async createRoute(data: CreateTourRouteDTO): Promise<TourRoute> {
    try {
      // 默认预订模式为咨询模式
      const bookingMode = data.bookingMode || BookingMode.INQUIRY;

      // 咨询模式必须提供客服电话
      if (bookingMode === BookingMode.INQUIRY && !data.customerServicePhone) {
        throw new Error('咨询模式必须提供客服电话');
      }

      // 创建路线记录（默认为禁用状态，默认为咨询模式）
      const route = this.routeRepository.create({
        id: uuidv4(),
        name: data.name,
        summary: data.summary,
        destination: data.destination,
        days: data.days,
        nights: data.nights,
        itinerary: JSON.stringify(data.itinerary),
        included: JSON.stringify(data.included),
        excluded: JSON.stringify(data.excluded),
        adultPrice: data.adultPrice,
        childPrice: data.childPrice,
        serviceMode: data.serviceMode,
        butlerFeePerDay: data.butlerFeePerDay,
        minParticipants: data.minParticipants || 10,
        maxParticipants: data.maxParticipants || 30,
        coverImage: data.coverImage,
        images: data.images ? JSON.stringify(data.images) : undefined,
        status: TourStatus.DISABLED,
        bookingMode: bookingMode,
        customerServicePhone: data.customerServicePhone,
        averageRating: 0,
        reviewCount: 0,
        salesCount: 0,
      });

      await this.routeRepository.save(route);

      logger.info(`旅游路线创建成功: ${route.id} - ${route.name} (预订模式: ${bookingMode})`);
      return route;
    } catch (error) {
      logger.error('创建旅游路线失败:', error);
      throw error;
    }
  }

  /**
   * 更新旅游路线
   */
  async updateRoute(id: string, data: UpdateTourRouteDTO): Promise<TourRoute> {
    try {
      const route = await this.routeRepository.findOne({ where: { id } });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      // 更新字段
      if (data.name !== undefined) route.name = data.name;
      if (data.summary !== undefined) route.summary = data.summary;
      if (data.destination !== undefined) route.destination = data.destination;
      if (data.days !== undefined) route.days = data.days;
      if (data.nights !== undefined) route.nights = data.nights;
      if (data.itinerary !== undefined) route.itinerary = JSON.stringify(data.itinerary);
      if (data.included !== undefined) route.included = JSON.stringify(data.included);
      if (data.excluded !== undefined) route.excluded = JSON.stringify(data.excluded);
      if (data.adultPrice !== undefined) route.adultPrice = data.adultPrice;
      if (data.childPrice !== undefined) route.childPrice = data.childPrice;
      if (data.serviceMode !== undefined) route.serviceMode = data.serviceMode;
      if (data.butlerFeePerDay !== undefined) route.butlerFeePerDay = data.butlerFeePerDay;
      if (data.minParticipants !== undefined) route.minParticipants = data.minParticipants;
      if (data.maxParticipants !== undefined) route.maxParticipants = data.maxParticipants;
      if (data.coverImage !== undefined) route.coverImage = data.coverImage;
      if (data.images !== undefined) route.images = JSON.stringify(data.images);

      // 更新预订模式相关字段
      if (data.bookingMode !== undefined) {
        // 如果切换到咨询模式，必须提供客服电话
        if (
          data.bookingMode === BookingMode.INQUIRY &&
          !data.customerServicePhone &&
          !route.customerServicePhone
        ) {
          throw new Error('咨询模式必须提供客服电话');
        }
        route.bookingMode = data.bookingMode;
      }
      if (data.customerServicePhone !== undefined) {
        route.customerServicePhone = data.customerServicePhone;
      }

      await this.routeRepository.save(route);

      logger.info(`旅游路线更新成功: ${route.id}`);
      return route;
    } catch (error) {
      logger.error('更新旅游路线失败:', error);
      throw error;
    }
  }

  /**
   * 切换路线状态
   */
  async switchStatus(id: string, status: TourStatus): Promise<TourRoute> {
    try {
      const route = await this.routeRepository.findOne({ where: { id } });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      // 如果要启用路线，需要检查是否有可订批次
      if (status === TourStatus.ENABLED) {
        const availableBatches = await this.batchRepository.count({
          where: {
            routeId: id,
            status: BatchStatus.PENDING,
          },
        });

        if (availableBatches === 0) {
          throw new Error('启用路线需要至少有一个待成团批次');
        }
      }

      route.status = status;
      await this.routeRepository.save(route);

      logger.info(`旅游路线状态切换成功: ${route.id} -> ${status}`);
      return route;
    } catch (error) {
      logger.error('切换旅游路线状态失败:', error);
      throw error;
    }
  }

  /**
   * 切换预订模式
   */
  async switchBookingMode(
    id: string,
    newMode: BookingMode,
    customerServicePhone?: string
  ): Promise<TourRoute> {
    try {
      const route = await this.routeRepository.findOne({ where: { id } });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      // 如果切换到咨询模式，必须提供客服电话
      if (newMode === BookingMode.INQUIRY) {
        if (!customerServicePhone && !route.customerServicePhone) {
          throw new Error('咨询模式必须提供客服电话');
        }
        if (customerServicePhone) {
          route.customerServicePhone = customerServicePhone;
        }
      }

      // 如果切换到实时预订模式，需要验证路线信息完整性
      if (newMode === BookingMode.REALTIME) {
        // 验证路线信息完整
        if (!route.itinerary || !route.included || !route.excluded) {
          throw new Error('切换到实时预订模式前，必须完善路线信息（行程、包含项目、不含项目）');
        }

        if (!route.adultPrice || route.adultPrice <= 0) {
          throw new Error('切换到实时预订模式前，必须设置有效的成人价格');
        }

        // 验证至少有一个可用批次
        const availableBatches = await this.batchRepository.find({
          where: {
            routeId: id,
          },
        });

        const validBatches = availableBatches.filter(
          batch =>
            (batch.status === BatchStatus.PENDING || batch.status === BatchStatus.CONFIRMED) &&
            batch.stock > 0
        );

        if (validBatches.length === 0) {
          throw new Error(
            '切换到实时预订模式前，必须至少有一个可用的出发批次（状态为待成团或已成团，且库存大于0）'
          );
        }
      }

      const oldMode = route.bookingMode;
      route.bookingMode = newMode;
      await this.routeRepository.save(route);

      logger.info(`旅游路线预订模式切换成功: ${route.id} - ${oldMode} -> ${newMode}`);
      return route;
    } catch (error) {
      logger.error('切换旅游路线预订模式失败:', error);
      throw error;
    }
  }

  /**
   * 获取路线列表
   */
  async getRouteList(params: TourRouteListDTO): Promise<{
    routes: TourRoute[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        destination,
        minDays,
        maxDays,
        minPrice,
        maxPrice,
        status,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = params;

      const queryBuilder = this.routeRepository.createQueryBuilder('route');

      // 筛选条件
      if (destination) {
        queryBuilder.andWhere('route.destination = :destination', {
          destination,
        });
      }

      if (minDays) {
        queryBuilder.andWhere('route.days >= :minDays', { minDays });
      }

      if (maxDays) {
        queryBuilder.andWhere('route.days <= :maxDays', { maxDays });
      }

      if (minPrice) {
        queryBuilder.andWhere('route.adultPrice >= :minPrice', { minPrice });
      }

      if (maxPrice) {
        queryBuilder.andWhere('route.adultPrice <= :maxPrice', { maxPrice });
      }

      if (status) {
        queryBuilder.andWhere('route.status = :status', { status });
      }

      if (keyword) {
        queryBuilder.andWhere('(route.name LIKE :keyword OR route.summary LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }

      // 排序
      queryBuilder.orderBy(`route.${sortBy}`, sortOrder);

      // 分页
      const [routes, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      logger.info(`获取旅游路线列表成功: ${routes.length}/${total}`);
      return { routes, total, page, pageSize };
    } catch (error) {
      logger.error('获取旅游路线列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取路线详情
   */
  async getRouteById(id: string): Promise<TourRoute> {
    try {
      const route = await this.routeRepository.findOne({
        where: { id },
        relations: ['batches'],
      });

      if (!route) {
        throw new Error('旅游路线不存在');
      }

      logger.info(`获取旅游路线详情成功: ${route.id}`);
      return route;
    } catch (error) {
      logger.error('获取旅游路线详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除路线
   */
  async deleteRoute(id: string): Promise<void> {
    try {
      const route = await this.routeRepository.findOne({ where: { id } });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      // 检查是否有未完成的预订
      const pendingBatches = await this.batchRepository.count({
        where: {
          routeId: id,
          status: BatchStatus.PENDING,
        },
      });

      if (pendingBatches > 0) {
        throw new Error('该路线还有待成团批次，无法删除');
      }

      await this.routeRepository.remove(route);

      logger.info(`旅游路线删除成功: ${id}`);
    } catch (error) {
      logger.error('删除旅游路线失败:', error);
      throw error;
    }
  }
}
