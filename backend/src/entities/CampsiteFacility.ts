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
 * 设施类型枚举
 */
export enum FacilityType {
  WATER_ELECTRIC = 'water_electric', // 水电设施
  BATHROOM = 'bathroom', // 卫生间
  SHOWER = 'shower', // 淋浴
  LAUNDRY = 'laundry', // 洗衣房
  DINING = 'dining', // 餐饮
  ENTERTAINMENT = 'entertainment', // 娱乐设施
  PARKING = 'parking', // 停车场
  WIFI = 'wifi', // WiFi
  SECURITY = 'security', // 安保
  MEDICAL = 'medical', // 医疗
  SHOPPING = 'shopping', // 购物
  OTHER = 'other', // 其他
}

/**
 * 营地设施实体
 */
@Entity('campsite_facilities')
export class CampsiteFacility {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 36, comment: '营地ID' })
  @Index('idx_campsite_id')
  campsiteId!: string;

  @Column({
    type: 'enum',
    enum: FacilityType,
    comment: '设施类型',
  })
  @Index('idx_facility_type')
  facilityType!: FacilityType;

  @Column('varchar', { length: 50, comment: '设施名称' })
  name!: string;

  @Column('varchar', { length: 200, nullable: true, comment: '设施描述' })
  description?: string;

  @Column('varchar', { length: 200, nullable: true, comment: '设施图标' })
  icon?: string;

  @Column('boolean', { default: true, comment: '是否可用' })
  isAvailable!: boolean;

  @Column('int', { default: 0, comment: '排序权重' })
  sortOrder!: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => Campsite, campsite => campsite.facilities)
  @JoinColumn({ name: 'campsiteId' })
  campsite!: Campsite;
}

