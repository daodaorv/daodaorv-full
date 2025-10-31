import { AppDataSource } from '../config/database';
import { TourBatch, BatchStatus } from '../entities/TourBatch';
import { TourRoute } from '../entities/TourRoute';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { MoreThanOrEqual } from 'typeorm';

/**
 * 批次DTO接口
 */
export interface CreateTourBatchDTO {
  routeId: string;
  departureDate: Date;
  stock: number;
  notes?: string;
}

export interface UpdateTourBatchDTO {
  departureDate?: Date;
  stock?: number;
  notes?: string;
}

export interface TourBatchListDTO {
  page?: number;
  pageSize?: number;
  routeId?: string;
  status?: BatchStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 出发批次服务
 */
export class TourBatchService {
  private batchRepository = AppDataSource.getRepository(TourBatch);
  private routeRepository = AppDataSource.getRepository(TourRoute);

  /**
   * 创建批次
   */
  async createBatch(data: CreateTourBatchDTO): Promise<TourBatch> {
    try {
      // 验证路线是否存在
      const route = await this.routeRepository.findOne({
        where: { id: data.routeId },
      });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      // 验证出发日期必须晚于当前日期
      const departureDate = new Date(data.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (departureDate <= today) {
        throw new Error('出发日期必须晚于当前日期');
      }

      // 计算返回日期 = 出发日期 + 行程天数
      const returnDate = new Date(departureDate);
      returnDate.setDate(returnDate.getDate() + route.days);

      // 验证库存不能超过最大成团人数
      if (data.stock > route.maxParticipants) {
        throw new Error(
          `库存人数不能超过路线的最大成团人数（${route.maxParticipants}人）`
        );
      }

      // 创建批次记录
      const batch = this.batchRepository.create({
        id: uuidv4(),
        routeId: data.routeId,
        departureDate,
        returnDate,
        stock: data.stock,
        bookedCount: 0,
        status: BatchStatus.PENDING,
        notes: data.notes,
      });

      await this.batchRepository.save(batch);

      logger.info(`出发批次创建成功: ${batch.id} - ${batch.departureDate}`);
      return batch;
    } catch (error) {
      logger.error('创建出发批次失败:', error);
      throw error;
    }
  }

  /**
   * 更新批次
   */
  async updateBatch(id: string, data: UpdateTourBatchDTO): Promise<TourBatch> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { id },
        relations: ['route'],
      });
      if (!batch) {
        throw new Error('出发批次不存在');
      }

      // 如果批次已有预订，不允许修改出发日期和库存
      if (batch.bookedCount > 0) {
        if (data.departureDate || data.stock !== undefined) {
          throw new Error('批次已有预订，不允许修改出发日期和库存');
        }
      }

      // 更新字段
      if (data.departureDate !== undefined) {
        const departureDate = new Date(data.departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (departureDate <= today) {
          throw new Error('出发日期必须晚于当前日期');
        }

        batch.departureDate = departureDate;

        // 重新计算返回日期
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + batch.route.days);
        batch.returnDate = returnDate;
      }

      if (data.stock !== undefined) {
        if (data.stock > batch.route.maxParticipants) {
          throw new Error(
            `库存人数不能超过路线的最大成团人数（${batch.route.maxParticipants}人）`
          );
        }
        if (data.stock < batch.bookedCount) {
          throw new Error('库存人数不能少于已预订人数');
        }
        batch.stock = data.stock;
      }

      if (data.notes !== undefined) batch.notes = data.notes;

      await this.batchRepository.save(batch);

      logger.info(`出发批次更新成功: ${batch.id}`);
      return batch;
    } catch (error) {
      logger.error('更新出发批次失败:', error);
      throw error;
    }
  }

  /**
   * 更新批次状态
   */
  async updateBatchStatus(
    id: string,
    status: BatchStatus
  ): Promise<TourBatch> {
    try {
      const batch = await this.batchRepository.findOne({ where: { id } });
      if (!batch) {
        throw new Error('出发批次不存在');
      }

      batch.status = status;
      await this.batchRepository.save(batch);

      logger.info(`出发批次状态更新成功: ${batch.id} -> ${status}`);
      return batch;
    } catch (error) {
      logger.error('更新出发批次状态失败:', error);
      throw error;
    }
  }

  /**
   * 检查并更新成团状态
   */
  async checkAndUpdateGroupStatus(batchId: string): Promise<void> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { id: batchId },
        relations: ['route'],
      });

      if (!batch) {
        return;
      }

      // 如果已预订人数达到最小成团人数，且当前状态为待成团，则更新为已成团
      if (
        batch.bookedCount >= batch.route.minParticipants &&
        batch.status === BatchStatus.PENDING
      ) {
        batch.status = BatchStatus.CONFIRMED;
        await this.batchRepository.save(batch);
        logger.info(`批次已成团: ${batch.id} (${batch.bookedCount}人)`);
      }
    } catch (error) {
      logger.error('检查成团状态失败:', error);
    }
  }

  /**
   * 获取批次列表
   */
  async getBatchList(params: TourBatchListDTO): Promise<{
    batches: TourBatch[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        routeId,
        status,
        startDate,
        endDate,
      } = params;

      const queryBuilder = this.batchRepository
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.route', 'route');

      // 筛选条件
      if (routeId) {
        queryBuilder.andWhere('batch.routeId = :routeId', { routeId });
      }

      if (status) {
        queryBuilder.andWhere('batch.status = :status', { status });
      }

      if (startDate) {
        queryBuilder.andWhere('batch.departureDate >= :startDate', {
          startDate,
        });
      }

      if (endDate) {
        queryBuilder.andWhere('batch.departureDate <= :endDate', { endDate });
      }

      // 排序
      queryBuilder.orderBy('batch.departureDate', 'ASC');

      // 分页
      const [batches, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      logger.info(`获取出发批次列表成功: ${batches.length}/${total}`);
      return { batches, total, page, pageSize };
    } catch (error) {
      logger.error('获取出发批次列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取路线的可订批次（用户端）
   */
  async getAvailableBatches(routeId: string): Promise<TourBatch[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batches = await this.batchRepository.find({
        where: {
          routeId,
          departureDate: MoreThanOrEqual(today),
        },
        order: {
          departureDate: 'ASC',
        },
      });

      // 过滤出有库存的批次
      const availableBatches = batches.filter(
        (batch) => batch.bookedCount < batch.stock
      );

      logger.info(
        `获取可订批次成功: ${availableBatches.length}/${batches.length}`
      );
      return availableBatches;
    } catch (error) {
      logger.error('获取可订批次失败:', error);
      throw error;
    }
  }

  /**
   * 获取批次详情
   */
  async getBatchById(id: string): Promise<TourBatch> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { id },
        relations: ['route'],
      });

      if (!batch) {
        throw new Error('出发批次不存在');
      }

      logger.info(`获取出发批次详情成功: ${batch.id}`);
      return batch;
    } catch (error) {
      logger.error('获取出发批次详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除批次
   */
  async deleteBatch(id: string): Promise<void> {
    try {
      const batch = await this.batchRepository.findOne({ where: { id } });
      if (!batch) {
        throw new Error('出发批次不存在');
      }

      // 如果批次已有预订，不允许删除
      if (batch.bookedCount > 0) {
        throw new Error('批次已有预订，无法删除');
      }

      await this.batchRepository.remove(batch);

      logger.info(`出发批次删除成功: ${id}`);
    } catch (error) {
      logger.error('删除出发批次失败:', error);
      throw error;
    }
  }
}

