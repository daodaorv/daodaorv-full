import { AppDataSource } from '../config/database';
import { Vehicle, VehicleStatus, OwnershipType } from '../entities/Vehicle';
import { VehicleMaintenanceRecord } from '../entities/VehicleMaintenanceRecord';
import { VehicleTransfer } from '../entities/VehicleTransfer';
import { logger } from '../utils/logger';

/**
 * 车辆DTO接口
 */
export interface CreateVehicleDTO {
  licensePlate: string;
  vin: string;
  vehicleModelId: string;
  ownershipType: OwnershipType;
  storeId?: string;
  actualFacilities?: string[];
  images?: string[];
  year: number;
  mileage?: number;
  remarks?: string;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {
  status?: VehicleStatus;
}

export interface VehicleListDTO {
  page?: number;
  pageSize?: number;
  status?: VehicleStatus;
  ownershipType?: OwnershipType;
  vehicleModelId?: string;
  storeId?: string;
  keyword?: string;
}

/**
 * 可用车辆搜索DTO接口
 */
export interface SearchAvailableVehiclesDTO {
  pickupCityId?: string;
  pickupStoreId?: string;
  returnCityId?: string;
  returnStoreId?: string;
  pickupTime: string;
  returnTime: string;
  page?: number;
  pageSize?: number;
  vehicleModelId?: string;
  sortBy?: string; // price:asc|price:desc|rating:asc|rating:desc
}

/**
 * 维护记录DTO接口
 */
export interface CreateMaintenanceRecordDTO {
  vehicleId: string;
  maintenanceDate: Date;
  maintenanceContent: string;
  maintenanceCost: number;
  mileage: number;
  fuelLevel?: number;
  vehicleCondition?: string;
  maintainedBy?: string;
  storeId?: string;
}

/**
 * 调度记录DTO接口
 */
export interface CreateTransferDTO {
  vehicleId: string;
  transferDate: Date;
  fromStoreId: string;
  toStoreId: string;
  reason?: string;
  cost?: number;
  operatedBy?: string;
}

/**
 * 车辆服务
 */
export class VehicleService {
  private vehicleRepository = AppDataSource.getRepository(Vehicle);
  private maintenanceRepository = AppDataSource.getRepository(VehicleMaintenanceRecord);
  private transferRepository = AppDataSource.getRepository(VehicleTransfer);

  /**
   * 创建车辆
   */
  async createVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    try {
      logger.info('Creating vehicle', { licensePlate: data.licensePlate });

      // 检查车牌号是否已存在
      const existingPlate = await this.vehicleRepository.findOne({
        where: { licensePlate: data.licensePlate },
      });

      if (existingPlate) {
        throw new Error('车牌号已存在');
      }

      // 检查VIN码是否已存在
      const existingVin = await this.vehicleRepository.findOne({
        where: { vin: data.vin },
      });

      if (existingVin) {
        throw new Error('VIN码已存在');
      }

      const vehicle = this.vehicleRepository.create(data);
      await this.vehicleRepository.save(vehicle);

      logger.info('Vehicle created successfully', { id: vehicle.id });
      return vehicle;
    } catch (error) {
      logger.error('Failed to create vehicle', { error });
      throw error;
    }
  }

  /**
   * 更新车辆
   */
  async updateVehicle(id: string, data: UpdateVehicleDTO): Promise<Vehicle> {
    try {
      logger.info('Updating vehicle', { id });

      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      // 如果更新车牌号，检查是否重复
      if (data.licensePlate && data.licensePlate !== vehicle.licensePlate) {
        const existingPlate = await this.vehicleRepository.findOne({
          where: { licensePlate: data.licensePlate },
        });

        if (existingPlate) {
          throw new Error('车牌号已存在');
        }
      }

      // 如果更新VIN码，检查是否重复
      if (data.vin && data.vin !== vehicle.vin) {
        const existingVin = await this.vehicleRepository.findOne({
          where: { vin: data.vin },
        });

        if (existingVin) {
          throw new Error('VIN码已存在');
        }
      }

      Object.assign(vehicle, data);
      await this.vehicleRepository.save(vehicle);

      logger.info('Vehicle updated successfully', { id });
      return vehicle;
    } catch (error) {
      logger.error('Failed to update vehicle', { error });
      throw error;
    }
  }

  /**
   * 删除车辆
   */
  async deleteVehicle(id: string): Promise<void> {
    try {
      logger.info('Deleting vehicle', { id });

      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      // 删除关联的维护记录
      await AppDataSource.getRepository(VehicleMaintenanceRecord).delete({ vehicleId: id });

      // 删除关联的调度记录
      await AppDataSource.getRepository(VehicleTransfer).delete({ vehicleId: id });

      // TODO: 检查是否有关联的订单、众筹项目等

      await this.vehicleRepository.remove(vehicle);

      logger.info('Vehicle deleted successfully', { id });
    } catch (error) {
      logger.error('Failed to delete vehicle', { error });
      throw error;
    }
  }

  /**
   * 获取车辆详情
   */
  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      logger.info('Getting vehicle by id', { id });

      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
        relations: ['vehicleModel'],
      });

      return vehicle;
    } catch (error) {
      logger.error('Failed to get vehicle', { error });
      throw error;
    }
  }

  /**
   * 获取车辆列表
   */
  async getVehicleList(params: VehicleListDTO): Promise<{
    list: Vehicle[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        status,
        ownershipType,
        vehicleModelId,
        storeId,
        keyword,
      } = params;

      logger.info('Getting vehicle list', { params });

      const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');

      // 关联车型模板
      queryBuilder.leftJoinAndSelect('vehicle.vehicleModel', 'vehicleModel');

      // 筛选条件
      if (status) {
        queryBuilder.andWhere('vehicle.status = :status', { status });
      }

      if (ownershipType) {
        queryBuilder.andWhere('vehicle.ownershipType = :ownershipType', {
          ownershipType,
        });
      }

      if (vehicleModelId) {
        queryBuilder.andWhere('vehicle.vehicleModelId = :vehicleModelId', {
          vehicleModelId,
        });
      }

      if (storeId) {
        queryBuilder.andWhere('vehicle.storeId = :storeId', { storeId });
      }

      if (keyword) {
        queryBuilder.andWhere('(vehicle.licensePlate LIKE :keyword OR vehicle.vin LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }

      // 分页
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      // 排序
      queryBuilder.orderBy('vehicle.created_at', 'DESC');

      const [list, total] = await queryBuilder.getManyAndCount();

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('Failed to get vehicle list', { error });
      throw error;
    }
  }

  /**
   * 更新车辆状态
   */
  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    try {
      logger.info('Updating vehicle status', { id, status });

      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      vehicle.status = status;
      await this.vehicleRepository.save(vehicle);

      logger.info('Vehicle status updated successfully', { id, status });
      return vehicle;
    } catch (error) {
      logger.error('Failed to update vehicle status', { error });
      throw error;
    }
  }

  /**
   * 添加维护记录
   */
  async addMaintenanceRecord(data: CreateMaintenanceRecordDTO): Promise<VehicleMaintenanceRecord> {
    try {
      logger.info('Adding maintenance record', { vehicleId: data.vehicleId });

      // 检查车辆是否存在
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      const record = this.maintenanceRepository.create(data);
      await this.maintenanceRepository.save(record);

      // 更新车辆里程数
      if (data.mileage > vehicle.mileage) {
        vehicle.mileage = data.mileage;
        await this.vehicleRepository.save(vehicle);
      }

      logger.info('Maintenance record added successfully', { id: record.id });
      return record;
    } catch (error) {
      logger.error('Failed to add maintenance record', { error });
      throw error;
    }
  }

  /**
   * 获取车辆维护记录
   */
  async getMaintenanceRecords(vehicleId: string): Promise<VehicleMaintenanceRecord[]> {
    try {
      logger.info('Getting maintenance records', { vehicleId });

      const records = await this.maintenanceRepository.find({
        where: { vehicleId },
        order: { maintenanceDate: 'DESC' },
      });

      return records;
    } catch (error) {
      logger.error('Failed to get maintenance records', { error });
      throw error;
    }
  }

  /**
   * 添加调度记录
   */
  async addTransferRecord(data: CreateTransferDTO): Promise<VehicleTransfer> {
    try {
      logger.info('Adding transfer record', { vehicleId: data.vehicleId });

      // 检查车辆是否存在
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      const record = this.transferRepository.create(data);
      await this.transferRepository.save(record);

      // 更新车辆所属门店
      vehicle.storeId = data.toStoreId;
      await this.vehicleRepository.save(vehicle);

      logger.info('Transfer record added successfully', { id: record.id });
      return record;
    } catch (error) {
      logger.error('Failed to add transfer record', { error });
      throw error;
    }
  }

  /**
   * 获取车辆调度记录
   */
  async getTransferRecords(vehicleId: string): Promise<VehicleTransfer[]> {
    try {
      logger.info('Getting transfer records', { vehicleId });

      const records = await this.transferRepository.find({
        where: { vehicleId },
        order: { transferDate: 'DESC' },
      });

      return records;
    } catch (error) {
      logger.error('Failed to get transfer records', { error });
      throw error;
    }
  }
}
