import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './Vehicle';

/**
 * 车辆调度记录实体
 */
@Entity('vehicle_transfers')
export class VehicleTransfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, comment: '车辆ID' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Column({ type: 'datetime', comment: '调度时间' })
  transferDate!: Date;

  @Column({ type: 'varchar', length: 36, comment: '调出门店ID' })
  fromStoreId!: string;

  @Column({ type: 'varchar', length: 36, comment: '调入门店ID' })
  toStoreId!: string;

  @Column({ type: 'text', nullable: true, comment: '调度原因' })
  reason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '费用分摊' })
  cost?: number;

  @Column({ type: 'uuid', nullable: true, comment: '操作人员ID' })
  operatedBy?: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at!: Date;
}
