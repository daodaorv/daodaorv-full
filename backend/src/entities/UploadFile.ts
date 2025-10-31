import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

// 文件类型枚举
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
}

// 业务类型枚举
export enum BusinessType {
  AVATAR = 'avatar', // 用户头像
  IDCARD = 'idcard', // 身份证照片
  LICENSE = 'license', // 驾驶证照片
  VEHICLE = 'vehicle', // 车辆图片
  COMMUNITY = 'community', // 社区图片
  CAMPSITE = 'campsite', // 营地图片
  TRAVEL = 'travel', // 旅游图片
  DOCUMENT = 'document', // 文档
  OTHER = 'other', // 其他
}

// 上传状态枚举
export enum UploadStatus {
  UPLOADING = 'uploading', // 上传中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
}

// 审核状态枚举
export enum AuditStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
}

@Entity('upload_files')
@Index(['userId', 'businessType', 'createdAt'])
export class UploadFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 文件基本信息
  @Column({ name: 'original_name', length: 255 })
  originalName!: string; // 原始文件名

  @Column({ name: 'file_size', type: 'int', comment: '文件大小（字节）' })
  fileSize!: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string; // MIME 类型

  // 存储信息
  @Column({ name: 'oss_url', length: 500 })
  ossUrl!: string; // OSS 访问 URL

  @Column({ name: 'oss_key', length: 500 })
  ossKey!: string; // OSS 文件键（路径）

  @Column({ name: 'bucket_name', length: 100 })
  bucketName!: string; // 存储桶名称

  // 缩略图信息（JSON 格式存储多个尺寸的 URL）
  @Column({ type: 'json', nullable: true })
  thumbnails?: {
    size: string;
    url: string;
  }[];

  // WebP 格式 URL
  @Column({ name: 'webp_url', length: 500, nullable: true })
  webpUrl?: string;

  // 分类信息
  @Column({
    type: 'enum',
    enum: FileType,
    name: 'file_type',
  })
  fileType!: FileType;

  @Column({
    type: 'enum',
    enum: BusinessType,
    name: 'business_type',
  })
  businessType!: BusinessType;

  // 关联信息
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'related_id', type: 'uuid', nullable: true, comment: '关联业务ID' })
  relatedId?: string;

  @Column({ name: 'related_type', length: 50, nullable: true, comment: '关联业务类型' })
  relatedType?: string;

  // 状态信息
  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.COMPLETED,
  })
  status!: UploadStatus;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.PENDING,
    name: 'audit_status',
    nullable: true,
  })
  auditStatus?: AuditStatus;

  @Column({ name: 'audit_remark', type: 'text', nullable: true, comment: '审核备注' })
  auditRemark?: string;

  // 时间戳
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
