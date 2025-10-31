import { AppDataSource } from '../config/database';
import { Campsite, BookingMode, CampsiteStatus } from '../entities/Campsite';
import { CampsiteSpot } from '../entities/CampsiteSpot';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 营地DTO接口
 */
export interface CreateCampsiteDTO {
  name: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactPerson?: string;
  businessHours?: string;
  servicePhone?: string;
  serviceWechat?: string;
  consultationTip?: string;
  description?: string;
  images?: string[];
  videos?: string[];
}

export interface UpdateCampsiteDTO {
  name?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactPerson?: string;
  businessHours?: string;
  servicePhone?: string;
  serviceWechat?: string;
  consultationTip?: string;
  description?: string;
  images?: string[];
  videos?: string[];
  sortOrder?: number;
}

export interface CampsiteListDTO {
  page?: number;
  pageSize?: number;
  city?: string;
  bookingMode?: BookingMode;
  status?: CampsiteStatus;
  keyword?: string;
  sortBy?: 'createdAt' | 'averageRating' | 'bookingCount' | 'sortOrder';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 营地服务
 */
export class CampsiteService {
  private campsiteRepository = AppDataSource.getRepository(Campsite);
  private spotRepository = AppDataSource.getRepository(CampsiteSpot);

  /**
   * 创建营地
   */
  async createCampsite(data: CreateCampsiteDTO): Promise<Campsite> {
    try {
      // 创建营地记录（默认为咨询模式、禁用状态）
      const campsite = this.campsiteRepository.create({
        id: uuidv4(),
        name: data.name,
        city: data.city,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPhone: data.contactPhone,
        contactPerson: data.contactPerson,
        businessHours: data.businessHours,
        bookingMode: BookingMode.CONSULTATION,
        status: CampsiteStatus.DISABLED,
        servicePhone: data.servicePhone,
        serviceWechat: data.serviceWechat,
        consultationTip: data.consultationTip,
        description: data.description,
        images: data.images,
        videos: data.videos,
        averageRating: 0,
        reviewCount: 0,
        bookingCount: 0,
        totalSpots: 0,
        sortOrder: 0,
      });

      await this.campsiteRepository.save(campsite);

      logger.info(`营地创建成功: ${campsite.id} - ${campsite.name}`);
      return campsite;
    } catch (error) {
      logger.error('创建营地失败:', error);
      throw error;
    }
  }

  /**
   * 更新营地信息
   */
  async updateCampsite(id: string, data: UpdateCampsiteDTO): Promise<Campsite> {
    try {
      const campsite = await this.campsiteRepository.findOne({ where: { id } });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 更新字段
      Object.assign(campsite, data);

      await this.campsiteRepository.save(campsite);

      logger.info(`营地更新成功: ${id}`);
      return campsite;
    } catch (error) {
      logger.error('更新营地失败:', error);
      throw error;
    }
  }

  /**
   * 切换预订模式
   */
  async switchBookingMode(id: string, mode: BookingMode): Promise<Campsite> {
    try {
      const campsite = await this.campsiteRepository.findOne({
        where: { id },
        relations: ['spots'],
      });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 切换为咨询模式：检查是否配置客服电话
      if (mode === BookingMode.CONSULTATION) {
        if (!campsite.servicePhone) {
          throw new Error('咨询模式必须配置客服电话');
        }
      }

      // 切换为实时预订：检查是否配置营位库存
      if (mode === BookingMode.REALTIME) {
        if (!campsite.spots || campsite.spots.length === 0) {
          throw new Error('实时预订模式必须先配置营位库存');
        }

        const hasValidSpot = campsite.spots.some(spot => spot.isAvailable && spot.quantity > 0);

        if (!hasValidSpot) {
          throw new Error('实时预订模式必须至少有一个可用营位');
        }
      }

      campsite.bookingMode = mode;
      await this.campsiteRepository.save(campsite);

      logger.info(`营地预订模式切换成功: ${id} -> ${mode}`);
      return campsite;
    } catch (error) {
      logger.error('切换预订模式失败:', error);
      throw error;
    }
  }

  /**
   * 切换营地状态
   */
  async switchStatus(id: string, status: CampsiteStatus): Promise<Campsite> {
    try {
      const campsite = await this.campsiteRepository.findOne({ where: { id } });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 启用营地：检查必要配置
      if (status === CampsiteStatus.ENABLED) {
        // 咨询模式必须配置客服电话
        if (campsite.bookingMode === BookingMode.CONSULTATION && !campsite.servicePhone) {
          throw new Error('咨询模式必须配置客服电话才能启用');
        }

        // 实时预订模式必须配置营位
        if (campsite.bookingMode === BookingMode.REALTIME) {
          const spots = await this.spotRepository.find({
            where: { campsiteId: id, isAvailable: true },
          });

          if (spots.length === 0) {
            throw new Error('实时预订模式必须配置营位才能启用');
          }
        }
      }

      campsite.status = status;
      await this.campsiteRepository.save(campsite);

      logger.info(`营地状态切换成功: ${id} -> ${status}`);
      return campsite;
    } catch (error) {
      logger.error('切换营地状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取营地列表
   */
  async getCampsiteList(params: CampsiteListDTO): Promise<{
    list: Campsite[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.campsiteRepository.createQueryBuilder('campsite');

      // 筛选条件
      if (params.city) {
        queryBuilder.andWhere('campsite.city = :city', { city: params.city });
      }

      if (params.bookingMode) {
        queryBuilder.andWhere('campsite.bookingMode = :bookingMode', {
          bookingMode: params.bookingMode,
        });
      }

      if (params.status) {
        queryBuilder.andWhere('campsite.status = :status', { status: params.status });
      }

      if (params.keyword) {
        queryBuilder.andWhere('campsite.name LIKE :keyword', {
          keyword: `%${params.keyword}%`,
        });
      }

      // 排序
      const sortBy = params.sortBy || 'sortOrder';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`campsite.${sortBy}`, sortOrder);

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [list, total] = await queryBuilder.getManyAndCount();

      return { list, total, page, pageSize };
    } catch (error) {
      logger.error('获取营地列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取营地详情
   */
  async getCampsiteDetail(id: string): Promise<Campsite> {
    try {
      const campsite = await this.campsiteRepository.findOne({
        where: { id },
        relations: ['facilities', 'spots'],
      });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      return campsite;
    } catch (error) {
      logger.error('获取营地详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除营地
   */
  async deleteCampsite(id: string): Promise<void> {
    try {
      const campsite = await this.campsiteRepository.findOne({ where: { id } });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 检查是否有未完成的预订
      // TODO: 添加预订检查逻辑

      await this.campsiteRepository.remove(campsite);

      logger.info(`营地删除成功: ${id}`);
    } catch (error) {
      logger.error('删除营地失败:', error);
      throw error;
    }
  }
}
