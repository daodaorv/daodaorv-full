-- DaoDaoRV 数据库初始化脚本
-- 创建时间: 2025-10-24
-- 数据库版本: v1.0.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `daodao_rv` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `daodao_rv`;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
  `phone` VARCHAR(11) NOT NULL UNIQUE COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码 (加密)',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
  `id_card_front_image` VARCHAR(255) DEFAULT NULL COMMENT '身份证正面照片URL',
  `id_card_back_image` VARCHAR(255) DEFAULT NULL COMMENT '身份证背面照片URL',
  `driving_license` VARCHAR(18) DEFAULT NULL COMMENT '驾驶证号',
  `driving_license_front_image` VARCHAR(255) DEFAULT NULL COMMENT '驾驶证正面照片URL',
  `driving_license_back_image` VARCHAR(255) DEFAULT NULL COMMENT '驾驶证背面照片URL',
  `status` ENUM('normal', 'frozen', 'banned') NOT NULL DEFAULT 'normal' COMMENT '账户状态',
  `member_type` ENUM('normal', 'plus', 'crowdfunding') NOT NULL DEFAULT 'normal' COMMENT '会员类型',
  `real_name_status` ENUM('not_submitted', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'not_submitted' COMMENT '实名认证状态',
  `driving_license_status` ENUM('not_submitted', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'not_submitted' COMMENT '驾驶证认证状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_member_type` (`member_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 车辆表 (vehicles)
-- ============================================
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '车辆ID',
  `license_plate` VARCHAR(20) NOT NULL UNIQUE COMMENT '车牌号',
  `vehicle_type` VARCHAR(50) NOT NULL COMMENT '车型',
  `brand` VARCHAR(50) NOT NULL COMMENT '品牌',
  `model` VARCHAR(50) NOT NULL COMMENT '型号',
  `year` INT NOT NULL COMMENT '年份',
  `mileage` INT NOT NULL DEFAULT 0 COMMENT '里程数',
  `status` ENUM('available', 'rented', 'maintenance', 'offline') NOT NULL DEFAULT 'available' COMMENT '车辆状态',
  `daily_price` DECIMAL(10,2) NOT NULL COMMENT '日租价格',
  `deposit` DECIMAL(10,2) NOT NULL COMMENT '押金',
  `capacity` INT NOT NULL COMMENT '容纳人数',
  `features` JSON DEFAULT NULL COMMENT '车辆特性',
  `images` JSON DEFAULT NULL COMMENT '车辆图片',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_license_plate` (`license_plate`),
  INDEX `idx_status` (`status`),
  INDEX `idx_daily_price` (`daily_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆表';

-- ============================================
-- 3. 订单表 (orders)
-- ============================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `vehicle_id` VARCHAR(36) NOT NULL COMMENT '车辆ID',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `rental_days` INT NOT NULL COMMENT '租赁天数',
  `rental_price` DECIMAL(10,2) NOT NULL COMMENT '租赁价格',
  `insurance_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '保险价格',
  `additional_services` JSON DEFAULT NULL COMMENT '附加服务',
  `total_price` DECIMAL(10,2) NOT NULL COMMENT '总价格',
  `status` ENUM('pending', 'paid', 'pickup', 'using', 'return', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid' COMMENT '支付状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_vehicle_id` (`vehicle_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================
-- 4. 众筹项目表 (crowdfunding_projects)
-- ============================================
CREATE TABLE IF NOT EXISTS `crowdfunding_projects` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '项目ID',
  `project_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '项目号',
  `project_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
  `vehicle_id` VARCHAR(36) NOT NULL COMMENT '车辆ID',
  `total_shares` INT NOT NULL DEFAULT 100 COMMENT '总份额',
  `share_price` DECIMAL(10,2) NOT NULL COMMENT '单份价格',
  `target_amount` DECIMAL(12,2) NOT NULL COMMENT '目标金额',
  `raised_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '已筹金额',
  `annual_yield` DECIMAL(5,2) NOT NULL COMMENT '年化收益率',
  `status` ENUM('draft', 'active', 'success', 'failed', 'closed') NOT NULL DEFAULT 'draft' COMMENT '项目状态',
  `start_date` DATETIME NOT NULL COMMENT '开始时间',
  `end_date` DATETIME NOT NULL COMMENT '结束时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_project_no` (`project_no`),
  INDEX `idx_vehicle_id` (`vehicle_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='众筹项目表';

-- ============================================
-- 5. 众筹份额表 (crowdfunding_shares)
-- ============================================
CREATE TABLE IF NOT EXISTS `crowdfunding_shares` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '份额ID',
  `project_id` VARCHAR(36) NOT NULL COMMENT '项目ID',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `share_count` INT NOT NULL COMMENT '份额数量',
  `purchase_price` DECIMAL(12,2) NOT NULL COMMENT '购买金额',
  `status` ENUM('active', 'transferred', 'redeemed') NOT NULL DEFAULT 'active' COMMENT '份额状态',
  `purchase_date` DATETIME NOT NULL COMMENT '购买时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`project_id`) REFERENCES `crowdfunding_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='众筹份额表';

-- ============================================
-- 6. 众筹车主积分表 (shareholder_points)
-- ============================================
CREATE TABLE IF NOT EXISTS `shareholder_points` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '积分ID',
  `user_id` VARCHAR(36) NOT NULL UNIQUE COMMENT '用户ID',
  `balance` INT NOT NULL DEFAULT 0 COMMENT '积分余额',
  `total_earned` INT NOT NULL DEFAULT 0 COMMENT '累计获得',
  `total_used` INT NOT NULL DEFAULT 0 COMMENT '累计使用',
  `expiry_date` DATE DEFAULT NULL COMMENT '过期日期',
  `status` ENUM('active', 'expired', 'cleared') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='众筹车主积分表';

-- ============================================
-- 7. 用户标签表 (user_tags)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_tags` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '标签ID (UUID)',
  `userId` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `tagName` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `tagType` ENUM('system', 'behavior', 'custom') NOT NULL DEFAULT 'custom' COMMENT '标签类型',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '标签描述',
  `createdBy` VARCHAR(36) DEFAULT NULL COMMENT '创建人ID (管理员)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_tag_name` (`tagName`),
  INDEX `idx_tag_type` (`tagType`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户标签表';

-- ============================================
-- 8. 用户审核记录表 (user_audit_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_audit_logs` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT '记录ID (UUID)',
  `userId` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `auditType` ENUM('realname', 'driving_license') NOT NULL COMMENT '审核类型',
  `auditResult` ENUM('not_submitted', 'pending', 'approved', 'rejected') NOT NULL COMMENT '审核结果',
  `auditReason` TEXT DEFAULT NULL COMMENT '审核原因 (拒绝时填写)',
  `auditBy` VARCHAR(36) NOT NULL COMMENT '审核人ID (管理员)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_audit_type` (`auditType`),
  INDEX `idx_audit_result` (`auditResult`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户审核记录表';

-- ============================================
-- 初始化数据 (可选)
-- ============================================

-- 插入测试管理员账户 (密码: admin123)
INSERT INTO `users` (`id`, `phone`, `password`, `nickname`, `status`, `member_type`, `real_name_status`, `driving_license_status`)
VALUES (
  UUID(),
  '13800138000',
  '$2b$10$YourHashedPasswordHere',
  '系统管理员',
  'normal',
  'normal',
  'approved',
  'approved'
);

-- 完成
SELECT 'Database initialization completed successfully!' AS message;

