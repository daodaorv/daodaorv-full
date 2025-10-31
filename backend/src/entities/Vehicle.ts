import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VehicleModel } from './VehicleModel';

/**
 * 车辆状态枚举
 */
export enum VehicleStatus {
  AVAILABLE = 'available', // 可用
  RENTED = 'rented', // 已租
  MAINTENANCE = 'maintenance', // 维护中
  RETIRED = 'retired', // 停用
}

/**
 * 所有权类型枚举
 */
export enum OwnershipType {
  PLATFORM = 'platform', // 平台自有
  CROWDFUNDING = 'crowdfunding', // 众筹房车
}

/**
 * 车辆实体
 * 存储具体车辆的档案信息
 */
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true, comment: '车牌号' })
  licensePlate!: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: 'VIN码' })
  vin!: string;

  // 关联车型模板
  @Column({ type: 'varchar', length: 36, comment: '车型模板ID' })
  vehicleModelId!: string;

  @ManyToOne(() => VehicleModel, model => model.vehicles)
  @JoinColumn({ name: 'vehicleModelId' })
  vehicleModel!: VehicleModel;

  // 所有权信息
  @Column({
    type: 'enum',
    enum: OwnershipType,
    default: OwnershipType.PLATFORM,
    comment: '所有权类型',
  })
  ownershipType!: OwnershipType;

  @Column({ type: 'uuid', nullable: true, comment: '所属门店ID' })
  storeId?: string;

  // 车辆状态
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
    comment: '车辆状态',
  })
  status!: VehicleStatus;

  // 实际配置（基于车型模板勾选的实际配置）
  @Column({ type: 'json', comment: '实际配置列表', nullable: true })
  actualFacilities?: string[];

  // 车辆图片（实际车辆图片）
  @Column({ type: 'json', comment: '车辆图片列表', nullable: true })
  images?: string[];

  // 车辆年份
  @Column({ type: 'int', comment: '车辆年份' })
  year!: number;

  // 里程数
  @Column({ type: 'int', default: 0, comment: '当前里程数(km)' })
  mileage!: number;

  // 备注
  @Column({ type: 'text', nullable: true, comment: '备注信息' })
  remarks?: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at!: Date;
}
