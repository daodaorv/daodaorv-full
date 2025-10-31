import { AppDataSource } from '../config/database';
import { CampsiteSpot, SpotType } from '../entities/CampsiteSpot';
import { Campsite } from '../entities/Campsite';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 营位DTO接口
 */
export interface CreateSpotDTO {
  campsiteId: string;
  spotType: SpotType;
  name: string;
  description?: string;
  quantity: number;
  pricePerNight: number;
  weekendPrice?: number;
  holidayPrice?: number;
  suitableVehicles?: string;
  dimensions?: string;
  images?: string[];
}

export interface UpdateSpotDTO {
  name?: string;
  description?: string;
  quantity?: number;
  pricePerNight?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  suitableVehicles?: string;
  dimensions?: string;
  images?: string[];
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface CheckAvailabilityDTO {
  campsiteId: string;
  spotType: SpotType;
  checkInDate: Date;
  checkOutDate: Date;
  quantity: number;
}

/**
 * 营位服务
 */
export class CampsiteSpotService {
  private spotRepository = AppDataSource.getRepository(CampsiteSpot);
  private campsiteRepository = AppDataSource.getRepository(Campsite);

  /**
   * 创建营位
   */
  async createSpot(data: CreateSpotDTO): Promise<CampsiteSpot> {
    try {
      // 验证营地是否存在
      const campsite = await this.campsiteRepository.findOne({
        where: { id: data.campsiteId },
      });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 检查是否已存在相同类型的营位
      const existingSpot = await this.spotRepository.findOne({
        where: {
          campsiteId: data.campsiteId,
          spotType: data.spotType,
        },
      });

      if (existingSpot) {
        throw new Error('该营位类型已存在，请更新现有营位');
      }

      // 创建营位
      const spot = this.spotRepository.create({
        id: uuidv4(),
        campsiteId: data.campsiteId,
        spotType: data.spotType,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        pricePerNight: data.pricePerNight,
        weekendPrice: data.weekendPrice,
        holidayPrice: data.holidayPrice,
        suitableVehicles: data.suitableVehicles,
        dimensions: data.dimensions,
        images: data.images,
        isAvailable: true,
        sortOrder: 0,
      });

      await this.spotRepository.save(spot);

      // 更新营地总营位数量
      await this.updateCampsiteTotalSpots(data.campsiteId);

      logger.info(`营位创建成功: ${spot.id} - ${spot.name}`);
      return spot;
    } catch (error) {
      logger.error('创建营位失败:', error);
      throw error;
    }
  }

  /**
   * 更新营位
   */
  async updateSpot(id: string, data: UpdateSpotDTO): Promise<CampsiteSpot> {
    try {
      const spot = await this.spotRepository.findOne({ where: { id } });

      if (!spot) {
        throw new Error('营位不存在');
      }

      // 更新字段
      Object.assign(spot, data);

      await this.spotRepository.save(spot);

      // 更新营地总营位数量
      await this.updateCampsiteTotalSpots(spot.campsiteId);

      logger.info(`营位更新成功: ${id}`);
      return spot;
    } catch (error) {
      logger.error('更新营位失败:', error);
      throw error;
    }
  }

  /**
   * 获取营地的所有营位
   */
  async getSpotsByCampsite(campsiteId: string): Promise<CampsiteSpot[]> {
    try {
      const spots = await this.spotRepository.find({
        where: { campsiteId },
        order: { sortOrder: 'DESC', spotType: 'ASC' },
      });

      return spots;
    } catch (error) {
      logger.error('获取营位列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取营位详情
   */
  async getSpotById(id: string): Promise<CampsiteSpot> {
    try {
      const spot = await this.spotRepository.findOne({ where: { id } });

      if (!spot) {
        throw new Error('营位不存在');
      }

      return spot;
    } catch (error) {
      logger.error('获取营位详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除营位
   */
  async deleteSpot(id: string): Promise<void> {
    try {
      const spot = await this.spotRepository.findOne({ where: { id } });

      if (!spot) {
        throw new Error('营位不存在');
      }

      const campsiteId = spot.campsiteId;

      await this.spotRepository.remove(spot);

      // 更新营地总营位数量
      await this.updateCampsiteTotalSpots(campsiteId);

      logger.info(`营位删除成功: ${id}`);
    } catch (error) {
      logger.error('删除营位失败:', error);
      throw error;
    }
  }

  /**
   * 检查营位可用性（简化版，实际应查询预订表）
   */
  async checkAvailability(params: CheckAvailabilityDTO): Promise<{
    available: boolean;
    availableQuantity: number;
  }> {
    try {
      const spot = await this.spotRepository.findOne({
        where: {
          campsiteId: params.campsiteId,
          spotType: params.spotType,
          isAvailable: true,
        },
      });

      if (!spot) {
        return { available: false, availableQuantity: 0 };
      }

      // TODO: 实际应查询预订表，计算指定日期范围内的可用数量
      // 这里简化处理，直接返回营位总数量
      const availableQuantity = spot.quantity;

      return {
        available: availableQuantity >= params.quantity,
        availableQuantity,
      };
    } catch (error) {
      logger.error('检查营位可用性失败:', error);
      throw error;
    }
  }

  /**
   * 更新营地总营位数量
   */
  private async updateCampsiteTotalSpots(campsiteId: string): Promise<void> {
    try {
      const spots = await this.spotRepository.find({
        where: { campsiteId, isAvailable: true },
      });

      const totalSpots = spots.reduce((sum, spot) => sum + spot.quantity, 0);

      await this.campsiteRepository.update(campsiteId, { totalSpots });

      logger.info(`营地总营位数量更新: ${campsiteId} -> ${totalSpots}`);
    } catch (error) {
      logger.error('更新营地总营位数量失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}
