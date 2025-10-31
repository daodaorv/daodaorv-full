import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Campsite } from './Campsite';

/**
 * 营位类型枚举
 */
export enum SpotType {
  STANDARD = 'standard', // 标准营位
  WATER_ELECTRIC = 'water_electric', // 水电营位
  LUXURY = 'luxury', // 豪华营位
}

/**
 * 营位实体
 */
@Entity('campsite_spots')
export class CampsiteSpot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 36, comment: '营地ID' })
  @Index('idx_campsite_id')
  campsiteId!: string;

  @Column({
    type: 'enum',
    enum: SpotType,
    comment: '营位类型',
  })
  @Index('idx_spot_type')
  spotType!: SpotType;

  @Column('varchar', { length: 50, comment: '营位类型名称' })
  name!: string;

  @Column('varchar', { length: 200, nullable: true, comment: '营位描述' })
  description?: string;

  @Column('int', { comment: '营位数量' })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '价格（元/晚）' })
  pricePerNight!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, comment: '周末价格（元/晚）' })
  weekendPrice?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, comment: '节假日价格（元/晚）' })
  holidayPrice?: number;

  @Column('varchar', { length: 100, nullable: true, comment: '适用车型' })
  suitableVehicles?: string;

  @Column('varchar', { length: 100, nullable: true, comment: '营位规格（长x宽）' })
  dimensions?: string;

  @Column('json', { nullable: true, comment: '营位图片列表' })
  images?: string[];

  @Column('boolean', { default: true, comment: '是否可用' })
  isAvailable!: boolean;

  @Column('int', { default: 0, comment: '排序权重' })
  sortOrder!: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => Campsite, campsite => campsite.spots)
  @JoinColumn({ name: 'campsiteId' })
  campsite!: Campsite;
}
