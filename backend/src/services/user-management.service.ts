import { AppDataSource } from '../config/database';
import { User, UserStatus, AuthStatus, MemberType } from '../entities/User';
import { UserTag, TagType } from '../entities/UserTag';
import { UserAuditLog, AuditType } from '../entities/UserAuditLog';
import { logger } from '../utils/logger';
import { Like, In } from 'typeorm';
import ExcelJS from 'exceljs';
import { maskPhone, maskIdCard } from '../utils/data-mask';

export interface GetUserListQuery {
  page?: number;
  pageSize?: number;
  status?: UserStatus;
  memberType?: MemberType;
  realNameStatus?: AuthStatus;
  drivingLicenseStatus?: AuthStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string; // 搜索手机号或昵称
}

export interface UpdateUserInfoDto {
  nickname?: string;
  avatar?: string;
  memberType?: MemberType;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

export interface AuditDto {
  auditResult: 'approved' | 'rejected';
  auditReason?: string;
  auditBy: string; // 审核人ID
}

export interface AddUserTagDto {
  userId: string;
  tagName: string;
  tagType?: TagType;
  description?: string;
  createdBy: string; // 创建人ID
}

export class UserManagementService {
  private userRepository = AppDataSource.getRepository(User);
  private userTagRepository = AppDataSource.getRepository(UserTag);
  private userAuditLogRepository = AppDataSource.getRepository(UserAuditLog);

  /**
   * 获取用户列表（分页、筛选）
   */
  async getUserList(query: GetUserListQuery) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        memberType,
        realNameStatus,
        drivingLicenseStatus,
        startDate: _startDate,
        endDate: _endDate,
        keyword,
      } = query;

      logger.info('查询用户列表', { query });

      const where: any = {};

      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 会员类型筛选
      if (memberType) {
        where.memberType = memberType;
      }

      // 实名认证状态筛选
      if (realNameStatus) {
        where.realNameStatus = realNameStatus;
      }

      // 驾照认证状态筛选
      if (drivingLicenseStatus) {
        where.drivingLicenseStatus = drivingLicenseStatus;
      }

      // 关键词搜索（手机号或昵称）
      if (keyword) {
        where.phone = Like(`%${keyword}%`);
        // 注意：这里简化处理，实际应该用OR查询
      }

      const [users, total] = await this.userRepository.findAndCount({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          created_at: 'DESC',
        },
        select: [
          'id',
          'phone',
          'nickname',
          'avatar',
          'memberType',
          'realNameStatus',
          'drivingLicenseStatus',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      logger.info(`用户列表查询成功: 共${total}条记录`);

      return {
        list: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('查询用户列表失败', error);
      throw error;
    }
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string) {
    try {
      logger.info(`查询用户详情: ${userId}`);

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 查询用户标签
      const tags = await this.userTagRepository.find({
        where: { userId },
      });

      // 查询审核记录
      const auditLogs = await this.userAuditLogRepository.find({
        where: { userId },
        order: {
          created_at: 'DESC',
        },
        take: 10, // 最近10条审核记录
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userInfo } = user;

      logger.info(`用户详情查询成功: ${userId}`);

      return {
        ...userInfo,
        tags,
        auditLogs,
      };
    } catch (error) {
      logger.error(`查询用户详情失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, dto: UpdateUserInfoDto, operatorId: string) {
    try {
      logger.info(`更新用户信息: ${userId}`, { dto, operatorId });

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 更新字段
      if (dto.nickname !== undefined) {
        user.nickname = dto.nickname;
      }
      if (dto.avatar !== undefined) {
        user.avatar = dto.avatar;
      }
      if (dto.memberType !== undefined) {
        user.memberType = dto.memberType;
      }

      await this.userRepository.save(user);

      logger.info(`用户信息更新成功: ${userId} by ${operatorId}`);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userInfo } = user;
      return userInfo;
    } catch (error) {
      logger.error(`更新用户信息失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新用户状态（冻结/封禁/恢复）
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, operatorId: string) {
    try {
      logger.info(`更新用户状态: ${userId}`, { dto, operatorId });

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查状态是否需要更新
      if (user.status === dto.status) {
        throw new Error('状态无变化');
      }

      user.status = dto.status;
      await this.userRepository.save(user);

      logger.info(
        `用户状态更新成功: ${userId} -> ${dto.status} by ${operatorId}, 原因: ${dto.reason || '无'}`
      );

      return {
        message: '用户状态更新成功',
        status: dto.status,
      };
    } catch (error) {
      logger.error(`更新用户状态失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 审核实名资料
   */
  async auditRealName(userId: string, dto: AuditDto) {
    try {
      logger.info(`审核实名资料: ${userId}`, { dto });

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查是否已提交实名资料
      if (user.realNameStatus === AuthStatus.NOT_SUBMITTED) {
        throw new Error('用户未提交实名资料');
      }

      // 检查是否已审核通过
      if (user.realNameStatus === AuthStatus.APPROVED) {
        throw new Error('该资料已审核通过');
      }

      // 更新审核状态
      if (dto.auditResult === 'approved') {
        user.realNameStatus = AuthStatus.APPROVED;
      } else if (dto.auditResult === 'rejected') {
        user.realNameStatus = AuthStatus.REJECTED;
      }

      await this.userRepository.save(user);

      // 记录审核日志
      const auditLog = this.userAuditLogRepository.create({
        userId,
        auditType: AuditType.REALNAME,
        auditResult: user.realNameStatus,
        auditReason: dto.auditReason,
        auditBy: dto.auditBy,
      });

      await this.userAuditLogRepository.save(auditLog);

      logger.info(`实名资料审核成功: ${userId} -> ${dto.auditResult} by ${dto.auditBy}`);

      return {
        message: `实名资料审核${dto.auditResult === 'approved' ? '通过' : '拒绝'}`,
        auditResult: dto.auditResult,
      };
    } catch (error) {
      logger.error(`审核实名资料失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 审核驾照资料
   */
  async auditDrivingLicense(userId: string, dto: AuditDto) {
    try {
      logger.info(`审核驾照资料: ${userId}`, { dto });

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查是否已完成实名认证
      if (user.realNameStatus !== AuthStatus.APPROVED) {
        throw new Error('请先完成实名认证');
      }

      // 检查是否已提交驾照资料
      if (user.drivingLicenseStatus === AuthStatus.NOT_SUBMITTED) {
        throw new Error('用户未提交驾照资料');
      }

      // 检查是否已审核通过
      if (user.drivingLicenseStatus === AuthStatus.APPROVED) {
        throw new Error('该资料已审核通过');
      }

      // 更新审核状态
      if (dto.auditResult === 'approved') {
        user.drivingLicenseStatus = AuthStatus.APPROVED;
      } else if (dto.auditResult === 'rejected') {
        user.drivingLicenseStatus = AuthStatus.REJECTED;
      }

      await this.userRepository.save(user);

      // 记录审核日志
      const auditLog = this.userAuditLogRepository.create({
        userId,
        auditType: AuditType.DRIVING_LICENSE,
        auditResult: user.drivingLicenseStatus,
        auditReason: dto.auditReason,
        auditBy: dto.auditBy,
      });

      await this.userAuditLogRepository.save(auditLog);

      logger.info(`驾照资料审核成功: ${userId} -> ${dto.auditResult} by ${dto.auditBy}`);

      return {
        message: `驾照资料审核${dto.auditResult === 'approved' ? '通过' : '拒绝'}`,
        auditResult: dto.auditResult,
      };
    } catch (error) {
      logger.error(`审核驾照资料失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户标签列表
   */
  async getUserTags(userId: string) {
    try {
      logger.info(`查询用户标签: ${userId}`);

      const tags = await this.userTagRepository.find({
        where: { userId },
        order: {
          created_at: 'DESC',
        },
      });

      logger.info(`用户标签查询成功: ${userId}, 共${tags.length}个标签`);

      return tags;
    } catch (error) {
      logger.error(`查询用户标签失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 添加用户标签
   */
  async addUserTag(dto: AddUserTagDto) {
    try {
      logger.info(`添加用户标签: ${dto.userId}`, { dto });

      // 检查用户是否存在
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查标签是否已存在
      const existingTag = await this.userTagRepository.findOne({
        where: {
          userId: dto.userId,
          tagName: dto.tagName,
        },
      });

      if (existingTag) {
        throw new Error('标签已存在，无需重复添加');
      }

      // 创建标签
      const tag = this.userTagRepository.create({
        userId: dto.userId,
        tagName: dto.tagName,
        tagType: dto.tagType || TagType.CUSTOM,
        description: dto.description,
        createdBy: dto.createdBy,
      });

      await this.userTagRepository.save(tag);

      logger.info(`用户标签添加成功: ${dto.userId} - ${dto.tagName} by ${dto.createdBy}`);

      return tag;
    } catch (error) {
      logger.error(`添加用户标签失败: ${dto.userId}`, error);
      throw error;
    }
  }

  /**
   * 删除用户标签
   */
  async removeUserTag(userId: string, tagId: string, operatorId: string) {
    try {
      logger.info(`删除用户标签: ${userId} - ${tagId}`, { operatorId });

      const tag = await this.userTagRepository.findOne({
        where: {
          id: tagId,
          userId,
        },
      });

      if (!tag) {
        throw new Error('标签不存在');
      }

      await this.userTagRepository.remove(tag);

      logger.info(`用户标签删除成功: ${userId} - ${tagId} by ${operatorId}`);

      return {
        message: '标签删除成功',
      };
    } catch (error) {
      logger.error(`删除用户标签失败: ${userId} - ${tagId}`, error);
      throw error;
    }
  }

  /**
   * 批量添加标签
   */
  async batchAddTags(userIds: string[], tagName: string, tagType: TagType, createdBy: string) {
    try {
      logger.info(`批量添加标签: ${userIds.length}个用户`, {
        tagName,
        tagType,
        createdBy,
      });

      // 验证用户是否存在
      const users = await this.userRepository.find({
        where: {
          id: In(userIds),
        },
      });

      if (users.length !== userIds.length) {
        throw new Error('部分用户不存在');
      }

      let successCount = 0;

      for (const userId of userIds) {
        try {
          // 检查标签是否已存在
          const existingTag = await this.userTagRepository.findOne({
            where: {
              userId,
              tagName,
            },
          });

          if (!existingTag) {
            const tag = this.userTagRepository.create({
              userId,
              tagName,
              tagType,
              createdBy,
            });
            await this.userTagRepository.save(tag);
            successCount++;
          }
        } catch (error) {
          logger.warn(`为用户${userId}添加标签失败`, error);
        }
      }

      logger.info(`批量添加标签成功: ${successCount}/${userIds.length}`);

      return {
        message: `成功为${successCount}个用户添加标签`,
        successCount,
        totalCount: userIds.length,
      };
    } catch (error) {
      logger.error('批量添加标签失败', error);
      throw error;
    }
  }

  /**
   * 获取所有标签列表（用于筛选和选择）
   */
  async getTagList() {
    try {
      logger.info('查询所有标签列表');

      const tags = await this.userTagRepository
        .createQueryBuilder('tag')
        .select('tag.tagName')
        .addSelect('tag.tagType')
        .addSelect('COUNT(tag.id)', 'count')
        .groupBy('tag.tagName')
        .addGroupBy('tag.tagType')
        .getRawMany();

      logger.info(`标签列表查询成功: 共${tags.length}个标签`);

      return tags;
    } catch (error) {
      logger.error('查询标签列表失败', error);
      throw error;
    }
  }

  /**
   * 导出用户数据为Excel文件
   */
  async exportUsers(query: GetUserListQuery): Promise<ExcelJS.Buffer> {
    try {
      logger.info('开始导出用户数据', { query });

      // 获取用户列表（不分页，获取所有符合条件的数据）
      const {
        status,
        memberType,
        realNameStatus,
        drivingLicenseStatus,
        keyword,
      } = query;

      const where: any = {};

      if (status) where.status = status;
      if (memberType) where.memberType = memberType;
      if (realNameStatus) where.realNameStatus = realNameStatus;
      if (drivingLicenseStatus) where.drivingLicenseStatus = drivingLicenseStatus;
      if (keyword) where.phone = Like(`%${keyword}%`);

      const users = await this.userRepository.find({
        where,
        order: {
          created_at: 'DESC',
        },
        select: [
          'id',
          'phone',
          'nickname',
          'avatar',
          'realName',
          'idCard',
          'memberType',
          'realNameStatus',
          'drivingLicenseStatus',
          'status',
          'created_at',
          'updated_at',
        ],
      });

      logger.info(`导出用户数据: 共${users.length}条记录`);

      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('用户列表');

      // 设置列
      worksheet.columns = [
        { header: '用户ID', key: 'id', width: 40 },
        { header: '手机号', key: 'phone', width: 15 },
        { header: '昵称', key: 'nickname', width: 20 },
        { header: '真实姓名', key: 'realName', width: 15 },
        { header: '身份证号', key: 'idCard', width: 20 },
        { header: '会员类型', key: 'memberType', width: 15 },
        { header: '实名认证状态', key: 'realNameStatus', width: 15 },
        { header: '驾照认证状态', key: 'drivingLicenseStatus', width: 15 },
        { header: '账户状态', key: 'status', width: 12 },
        { header: '注册时间', key: 'created_at', width: 20 },
      ];

      // 样式设置
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // 添加数据行（脱敏处理）
      users.forEach(user => {
        worksheet.addRow({
          id: user.id,
          phone: maskPhone(user.phone), // 脱敏
          nickname: user.nickname || '',
          realName: user.realName || '',
          idCard: user.idCard ? maskIdCard(user.idCard) : '', // 脱敏
          memberType: this.getMemberTypeLabel(user.memberType),
          realNameStatus: this.getAuthStatusLabel(user.realNameStatus),
          drivingLicenseStatus: this.getAuthStatusLabel(user.drivingLicenseStatus),
          status: this.getUserStatusLabel(user.status),
          created_at: user.created_at.toISOString().replace('T', ' ').substring(0, 19),
        });
      });

      // 生成Excel文件Buffer
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info(`用户数据导出成功: ${users.length}条记录`);

      return buffer as ExcelJS.Buffer;
    } catch (error) {
      logger.error('导出用户数据失败', error);
      throw error;
    }
  }

  /**
   * 会员类型标签转换
   */
  private getMemberTypeLabel(type: MemberType): string {
    const labels: Record<MemberType, string> = {
      [MemberType.NORMAL]: '普通会员',
      [MemberType.PLUS]: 'PLUS 会员',
      [MemberType.CROWDFUNDING]: '众筹车主',
    };
    return labels[type] || type;
  }

  /**
   * 认证状态标签转换
   */
  private getAuthStatusLabel(status: AuthStatus): string {
    const labels: Record<AuthStatus, string> = {
      [AuthStatus.NOT_SUBMITTED]: '未提交',
      [AuthStatus.PENDING]: '审核中',
      [AuthStatus.APPROVED]: '已通过',
      [AuthStatus.REJECTED]: '已拒绝',
    };
    return labels[status] || status;
  }

  /**
   * 用户状态标签转换
   */
  private getUserStatusLabel(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      [UserStatus.NORMAL]: '正常',
      [UserStatus.FROZEN]: '冻结',
      [UserStatus.BANNED]: '封禁',
    };
    return labels[status] || status;
  }
}
