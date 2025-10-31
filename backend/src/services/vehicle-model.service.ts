import { AppDataSource } from '../config/database';
import { VehicleModel, VehicleCategory } from '../entities/VehicleModel';
import { logger } from '../utils/logger';

/**
 * 车型模板DTO接口
 */
export interface CreateVehicleModelDTO {
  modelName: string;
  brand: string;
  model: string;
  category: VehicleCategory;
  seatCount: number;
  bedCount: number;
  length?: string;
  width?: string;
  height?: string;
  weight?: string;
  facilities?: string[];
  images?: string[];
  description?: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  deposit: number;
}

export interface UpdateVehicleModelDTO extends Partial<CreateVehicleModelDTO> {
  isActive?: boolean;
}

export interface VehicleModelListDTO {
  page?: number;
  pageSize?: number;
  category?: VehicleCategory;
  brand?: string;
  isActive?: boolean;
  keyword?: string;
  sortBy?: string; // comprehensive, price, rating, popularity
  city?: string;
}

/**
 * 车型模板服务
 */
export class VehicleModelService {
  private vehicleModelRepository = AppDataSource.getRepository(VehicleModel);

  /**
   * 格式化价格字段为字符串（保留2位小数）
   */
  private formatPrices(model: VehicleModel): any {
    return {
      ...model,
      dailyPrice: Number(model.dailyPrice).toFixed(2),
      weeklyPrice: model.weeklyPrice ? Number(model.weeklyPrice).toFixed(2) : null,
      monthlyPrice: model.monthlyPrice ? Number(model.monthlyPrice).toFixed(2) : null,
      deposit: Number(model.deposit).toFixed(2),
    };
  }

  /**
   * 创建车型模板
   */
  async createModel(data: CreateVehicleModelDTO): Promise<VehicleModel> {
    try {
      logger.info('Creating vehicle model', { modelName: data.modelName });

      const model = this.vehicleModelRepository.create(data);
      await this.vehicleModelRepository.save(model);

      logger.info('Vehicle model created successfully', { id: model.id });
      return model;
    } catch (error) {
      logger.error('Failed to create vehicle model', { error });
      throw error;
    }
  }

  /**
   * 更新车型模板
   */
  async updateModel(id: string, data: UpdateVehicleModelDTO): Promise<VehicleModel> {
    try {
      logger.info('Updating vehicle model', { id });

      const model = await this.vehicleModelRepository.findOne({
        where: { id },
      });

      if (!model) {
        throw new Error('车型模板不存在');
      }

      Object.assign(model, data);
      await this.vehicleModelRepository.save(model);

      logger.info('Vehicle model updated successfully', { id });
      return this.formatPrices(model);
    } catch (error) {
      logger.error('Failed to update vehicle model', { error });
      throw error;
    }
  }

  /**
   * 删除车型模板
   */
  async deleteModel(id: string): Promise<void> {
    try {
      logger.info('Deleting vehicle model', { id });

      const model = await this.vehicleModelRepository.findOne({
        where: { id },
        relations: ['vehicles'],
      });

      if (!model) {
        throw new Error('车型模板不存在');
      }

      // 检查是否有关联的车辆
      if (model.vehicles && model.vehicles.length > 0) {
        throw new Error('该车型模板下还有关联车辆，无法删除');
      }

      await this.vehicleModelRepository.remove(model);

      logger.info('Vehicle model deleted successfully', { id });
    } catch (error) {
      logger.error('Failed to delete vehicle model', { error });
      throw error;
    }
  }

  /**
   * 获取车型模板详情
   */
  async getModelById(id: string): Promise<VehicleModel | null> {
    try {
      logger.info('Getting vehicle model by id', { id });

      const model = await this.vehicleModelRepository.findOne({
        where: { id },
      });

      return model;
    } catch (error) {
      logger.error('Failed to get vehicle model', { error });
      throw error;
    }
  }

  /**
   * 获取车型模板列表
   */
  async getModelList(params: VehicleModelListDTO): Promise<{
    list: VehicleModel[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        category,
        brand,
        isActive,
        keyword,
        sortBy = 'comprehensive',
        city
      } = params;

      logger.info('Getting vehicle model list', { params });

      const queryBuilder = this.vehicleModelRepository.createQueryBuilder('model');

      // 筛选条件
      if (category) {
        queryBuilder.andWhere('model.category = :category', { category });
      }

      if (brand) {
        queryBuilder.andWhere('model.brand = :brand', { brand });
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('model.isActive = :isActive', { isActive });
      }

      if (keyword) {
        queryBuilder.andWhere(
          '(model.modelName LIKE :keyword OR model.brand LIKE :keyword OR model.model LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }

      // TODO: 城市筛选逻辑，需要结合车辆表查询
      // 当前暂时不实现城市筛选，因为车型模板本身不包含城市信息

      // 根据排序规则排序
      switch (sortBy) {
        case 'price':
          queryBuilder.orderBy('model.dailyPrice', 'ASC');
          break;
        case 'rating':
          // TODO: 需要关联评价表计算平均评分
          queryBuilder.orderBy('model.created_at', 'DESC');
          break;
        case 'popularity':
          // TODO: 需要关联订单表计算热度
          queryBuilder.orderBy('model.created_at', 'DESC');
          break;
        case 'comprehensive':
        default:
          // 综合排序：考虑价格、品牌热度、创建时间等
          queryBuilder
            .addSelect('(model.dailyPrice * 0.3) AS priceScore')
            .addSelect('model.created_at AS createTime')
            .orderBy('model.dailyPrice', 'ASC') // 价格优先
            .addOrderBy('model.created_at', 'DESC'); // 其次按创建时间
          break;
      }

      // 分页
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      const [list, total] = await queryBuilder.getManyAndCount();

      // 为每个车型添加综合评分（用于前端排序）
      const listWithScores = list.map(model => ({
        ...model,
        comprehensiveScore: this.calculateComprehensiveScore(model)
      }));

      // 如果是综合排序，重新排序
      if (sortBy === 'comprehensive') {
        listWithScores.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);
      }

      return {
        list: listWithScores,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('Failed to get vehicle model list', { error });
      throw error;
    }
  }

  /**
   * 计算综合评分
   */
  private calculateComprehensiveScore(model: VehicleModel): number {
    // 简化的综合评分算法
    // 实际项目中应该基于真实的评价数据、订单数据等
    let score = 50; // 基础分

    // 价格合理性（价格越低分数越高，但不是绝对）
    const priceScore = Math.max(0, 100 - (model.dailyPrice / 1000) * 20);
    score += priceScore * 0.2;

    // 品牌热度（基于品牌知名度）
    const brandScores: { [key: string]: number } = {
      '宇通': 90, '金龙': 85, '中通': 80, '苏州金龙': 82,
      '亚星': 75, '安凯': 78, '少林': 70, '青年': 72
    };
    const brandScore = brandScores[model.brand] || 60;
    score += brandScore * 0.3;

    // 新车加分（基于创建时间，越新分数越高）
    const daysSinceCreation = Math.floor(
      (Date.now() - model.created_at.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newnessScore = Math.max(0, 100 - daysSinceCreation * 0.5);
    score += newnessScore * 0.2;

    // 配置丰富度（基于设施配置）
    if (model.facilities && Array.isArray(model.facilities)) {
      const facilityScore = Math.min(30, model.facilities.length * 5);
      score += facilityScore * 0.3;
    }

    return Math.round(score);
  }

  /**
   * 获取所有启用的车型模板（用于下拉选择）
   */
  async getActiveModels(): Promise<VehicleModel[]> {
    try {
      logger.info('Getting active vehicle models');

      const models = await this.vehicleModelRepository.find({
        where: { isActive: true },
        order: { modelName: 'ASC' },
      });

      return models;
    } catch (error) {
      logger.error('Failed to get active vehicle models', { error });
      throw error;
    }
  }

  /**
   * 切换车型模板启用状态
   */
  async toggleActive(id: string): Promise<VehicleModel> {
    try {
      logger.info('Toggling vehicle model active status', { id });

      const model = await this.vehicleModelRepository.findOne({
        where: { id },
      });

      if (!model) {
        throw new Error('车型模板不存在');
      }

      model.isActive = !model.isActive;
      await this.vehicleModelRepository.save(model);

      logger.info('Vehicle model active status toggled', {
        id,
        isActive: model.isActive,
      });
      return model;
    } catch (error) {
      logger.error('Failed to toggle vehicle model active status', { error });
      throw error;
    }
  }
}
