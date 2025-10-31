import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum TagType {
  SYSTEM = 'system', // 系统标签
  BEHAVIOR = 'behavior', // 行为标签
  CUSTOM = 'custom', // 自定义标签
}

@Entity('user_tags')
export class UserTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  tagName!: string;

  @Column({
    type: 'enum',
    enum: TagType,
    default: TagType.CUSTOM,
  })
  tagType!: TagType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy?: string; // 创建人ID（管理员）

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
