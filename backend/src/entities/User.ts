import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MemberType {
  NORMAL = 'normal',
  PLUS = 'plus',
  CROWDFUNDING = 'crowdfunding',
}

export enum AuthStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NOT_SUBMITTED = 'not_submitted',
}

export enum UserStatus {
  NORMAL = 'normal',
  FROZEN = 'frozen',
  BANNED = 'banned',
}

export enum Platform {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  DOUYIN = 'douyin',
  PHONE = 'phone',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 11, unique: true, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname?: string;

  @Column({
    type: 'enum',
    enum: Platform,
    default: Platform.PHONE,
    comment: '注册平台来源',
  })
  platform!: Platform;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true, comment: '微信 openid' })
  wechatOpenid?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true, comment: '支付宝 userId' })
  alipayUserId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true, comment: '抖音 openid' })
  douyinOpenid?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  realName?: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  idCard?: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  drivingLicense?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idCardFrontImage?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idCardBackImage?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  drivingLicenseFrontImage?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  drivingLicenseBackImage?: string;

  @Column({
    type: 'enum',
    enum: MemberType,
    default: MemberType.NORMAL,
  })
  memberType!: MemberType;

  @Column({
    type: 'enum',
    enum: AuthStatus,
    default: AuthStatus.NOT_SUBMITTED,
  })
  realNameStatus!: AuthStatus;

  @Column({
    type: 'enum',
    enum: AuthStatus,
    default: AuthStatus.NOT_SUBMITTED,
  })
  drivingLicenseStatus!: AuthStatus;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.NORMAL,
  })
  status!: UserStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
