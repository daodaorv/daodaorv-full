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
 * 车辆维护记录实体
 */
@Entity('vehicle_maintenance_records')
export class VehicleMaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, comment: '车辆ID' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Column({ type: 'datetime', comment: '维护时间' })
  maintenanceDate!: Date;

  @Column({ type: 'text', comment: '维护内容' })
  maintenanceContent!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '维护费用' })
  maintenanceCost!: number;

  @Column({ type: 'int', comment: '维护时里程数(km)' })
  mileage!: number;

  @Column({ type: 'int', nullable: true, comment: '油量(%)' })
  fuelLevel?: number;

  @Column({ type: 'text', nullable: true, comment: '车况评估' })
  vehicleCondition?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '维护人员' })
  maintainedBy?: string;

  @Column({ type: 'uuid', nullable: true, comment: '维护门店ID' })
  storeId?: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at!: Date;
}
