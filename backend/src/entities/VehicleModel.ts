import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vehicle } from './Vehicle';

/**
 * 车型分类枚举
 */
export enum VehicleCategory {
  TYPE_B = 'type_b', // B型房车
  TYPE_C = 'type_c', // C型房车
  TRAILER = 'trailer', // 拖挂式
}

/**
 * 车型模板实体
 * 存储标准化的车型信息，供具体车辆引用
 */
@Entity('vehicle_models')
export class VehicleModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, comment: '车型名称' })
  modelName!: string;

  @Column({ type: 'varchar', length: 50, comment: '品牌' })
  brand!: string;

  @Column({ type: 'varchar', length: 50, comment: '型号' })
  model!: string;

  @Column({
    type: 'enum',
    enum: VehicleCategory,
    comment: '车型分类',
  })
  category!: VehicleCategory;

  // 车辆参数
  @Column({ type: 'int', comment: '座位数' })
  seatCount!: number;

  @Column({ type: 'int', comment: '床位数' })
  bedCount!: number;

  @Column({ type: 'varchar', length: 50, comment: '车身长度(米)', nullable: true })
  length?: string;

  @Column({ type: 'varchar', length: 50, comment: '车身宽度(米)', nullable: true })
  width?: string;

  @Column({ type: 'varchar', length: 50, comment: '车身高度(米)', nullable: true })
  height?: string;

  @Column({ type: 'varchar', length: 50, comment: '整备质量(kg)', nullable: true })
  weight?: string;

  // 设施配置（JSON数组）
  @Column({ type: 'json', comment: '设施配置列表', nullable: true })
  facilities?: string[];

  // 车型图片（JSON数组）
  @Column({ type: 'json', comment: '车型图片列表', nullable: true })
  images?: string[];

  // 车型详情（富文本）
  @Column({ type: 'text', comment: '车型详情富文本', nullable: true })
  description?: string;

  // 默认价格
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '日租价' })
  dailyPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '周租价', nullable: true })
  weeklyPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '月租价', nullable: true })
  monthlyPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '车辆押金' })
  vehicleDeposit!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '违章押金' })
  violationDeposit!: number;

  // 预留免押金接口字段
  @Column({ type: 'boolean', default: false, comment: '是否支持免押金' })
  supportDepositFree!: boolean;

  @Column({ type: 'json', nullable: true, comment: '免押金配置（芝麻信用、支付分等）' })
  depositFreeConfig?: any;

  // 状态
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  isActive!: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  created_at!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at!: Date;

  // 关联关系
  @OneToMany(() => Vehicle, vehicle => vehicle.vehicleModel)
  vehicles!: Vehicle[];
}
