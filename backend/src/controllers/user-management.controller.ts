import { UserManagementService } from '../services/user-management.service';
import { UserStatus, MemberType, AuthStatus } from '../entities/User';
import { TagType } from '../entities/UserTag';

const userManagementService = new UserManagementService();

export class UserManagementController {
  /**
   * 获取用户列表
   * GET /api/admin/users
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserList(ctx: any) {
    try {
      const {
        page,
        pageSize,
        status,
        memberType,
        realNameStatus,
        drivingLicenseStatus,
        startDate,
        endDate,
        keyword,
      } = ctx.query;

      const query = {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        status: status as UserStatus,
        memberType: memberType as MemberType,
        realNameStatus: realNameStatus as AuthStatus,
        drivingLicenseStatus: drivingLicenseStatus as AuthStatus,
        startDate,
        endDate,
        keyword,
      };

      const result = await userManagementService.getUserList(query);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '查询用户列表失败');
    }
  }

  /**
   * 获取用户详情
   * GET /api/admin/users/:id
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserDetail(ctx: any) {
    try {
      const { id } = ctx.params;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      const result = await userManagementService.getUserDetail(id);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '查询用户详情失败');
    }
  }

  /**
   * 更新用户信息
   * PUT /api/admin/users/:id
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateUserInfo(ctx: any) {
    try {
      const { id } = ctx.params;
      const dto = ctx.request.body;
      const operatorId = ctx.state.user?.userId;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      if (!operatorId) {
        ctx.error(401, '未登录');
        return;
      }

      const result = await userManagementService.updateUserInfo(id, dto, operatorId);
      ctx.success(result, '用户信息更新成功');
    } catch (error: any) {
      ctx.error(400, error.message || '更新用户信息失败');
    }
  }

  /**
   * 更新用户状态
   * PUT /api/admin/users/:id/status
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateUserStatus(ctx: any) {
    try {
      const { id } = ctx.params;
      const { status, reason } = ctx.request.body as any;
      const operatorId = ctx.state.user?.userId;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      if (!status) {
        ctx.error(400, '缺少状态参数');
        return;
      }

      if (!operatorId) {
        ctx.error(401, '未登录');
        return;
      }

      // 验证状态值
      if (!Object.values(UserStatus).includes(status)) {
        ctx.error(400, '无效的状态值');
        return;
      }

      // 冻结和封禁需要提供原因
      if ((status === UserStatus.FROZEN || status === UserStatus.BANNED) && !reason) {
        ctx.error(400, '冻结或封禁需要提供原因');
        return;
      }

      const result = await userManagementService.updateUserStatus(
        id,
        { status, reason },
        operatorId
      );
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '更新用户状态失败');
    }
  }

  /**
   * 审核实名资料
   * POST /api/admin/users/:id/audit/realname
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async auditRealName(ctx: any) {
    try {
      const { id } = ctx.params;
      const { auditResult, auditReason } = ctx.request.body as any;
      const auditBy = ctx.state.user?.userId;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      if (!auditResult) {
        ctx.error(400, '缺少审核结果');
        return;
      }

      if (!auditBy) {
        ctx.error(401, '未登录');
        return;
      }

      // 验证审核结果
      if (auditResult !== 'approved' && auditResult !== 'rejected') {
        ctx.error(400, '无效的审核结果');
        return;
      }

      // 拒绝时必须提供原因
      if (auditResult === 'rejected' && !auditReason) {
        ctx.error(400, '拒绝审核需要提供原因');
        return;
      }

      const result = await userManagementService.auditRealName(id, {
        auditResult,
        auditReason,
        auditBy,
      });
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '审核实名资料失败');
    }
  }

  /**
   * 审核驾照资料
   * POST /api/admin/users/:id/audit/driving-license
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async auditDrivingLicense(ctx: any) {
    try {
      const { id } = ctx.params;
      const { auditResult, auditReason } = ctx.request.body as any;
      const auditBy = ctx.state.user?.userId;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      if (!auditResult) {
        ctx.error(400, '缺少审核结果');
        return;
      }

      if (!auditBy) {
        ctx.error(401, '未登录');
        return;
      }

      // 验证审核结果
      if (auditResult !== 'approved' && auditResult !== 'rejected') {
        ctx.error(400, '无效的审核结果');
        return;
      }

      // 拒绝时必须提供原因
      if (auditResult === 'rejected' && !auditReason) {
        ctx.error(400, '拒绝审核需要提供原因');
        return;
      }

      const result = await userManagementService.auditDrivingLicense(id, {
        auditResult,
        auditReason,
        auditBy,
      });
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '审核驾照资料失败');
    }
  }

  /**
   * 获取用户标签
   * GET /api/admin/users/:id/tags
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserTags(ctx: any) {
    try {
      const { id } = ctx.params;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      const result = await userManagementService.getUserTags(id);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '查询用户标签失败');
    }
  }

  /**
   * 添加用户标签
   * POST /api/admin/users/:id/tags
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addUserTag(ctx: any) {
    try {
      const { id } = ctx.params;
      const { tagName, tagType, description } = ctx.request.body as any;
      const createdBy = ctx.state.user?.userId;

      if (!id) {
        ctx.error(400, '缺少用户ID');
        return;
      }

      if (!tagName) {
        ctx.error(400, '缺少标签名称');
        return;
      }

      if (!createdBy) {
        ctx.error(401, '未登录');
        return;
      }

      // 验证标签类型
      if (tagType && !Object.values(TagType).includes(tagType)) {
        ctx.error(400, '无效的标签类型');
        return;
      }

      const result = await userManagementService.addUserTag({
        userId: id,
        tagName,
        tagType: tagType || TagType.CUSTOM,
        description,
        createdBy,
      });
      ctx.success(result, '标签添加成功');
    } catch (error: any) {
      ctx.error(400, error.message || '添加用户标签失败');
    }
  }

  /**
   * 删除用户标签
   * DELETE /api/admin/users/:id/tags/:tagId
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async removeUserTag(ctx: any) {
    try {
      const { id, tagId } = ctx.params;
      const operatorId = ctx.state.user?.userId;

      if (!id || !tagId) {
        ctx.error(400, '缺少参数');
        return;
      }

      if (!operatorId) {
        ctx.error(401, '未登录');
        return;
      }

      const result = await userManagementService.removeUserTag(id, tagId, operatorId);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '删除用户标签失败');
    }
  }

  /**
   * 批量添加标签
   * POST /api/admin/users/tags/batch
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async batchAddTags(ctx: any) {
    try {
      const { userIds, tagName, tagType } = ctx.request.body as any;
      const createdBy = ctx.state.user?.userId;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        ctx.error(400, '缺少用户ID列表');
        return;
      }

      if (!tagName) {
        ctx.error(400, '缺少标签名称');
        return;
      }

      if (!createdBy) {
        ctx.error(401, '未登录');
        return;
      }

      // 验证标签类型
      if (tagType && !Object.values(TagType).includes(tagType)) {
        ctx.error(400, '无效的标签类型');
        return;
      }

      const result = await userManagementService.batchAddTags(
        userIds,
        tagName,
        tagType || TagType.CUSTOM,
        createdBy
      );
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '批量添加标签失败');
    }
  }

  /**
   * 获取所有标签列表
   * GET /api/admin/tags
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTagList(ctx: any) {
    try {
      const result = await userManagementService.getTagList();
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '查询标签列表失败');
    }
  }

  /**
   * 导出用户数据
   * GET /api/admin/users/export
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async exportUsers(ctx: any) {
    try {
      const {
        page,
        pageSize,
        status,
        memberType,
        realNameStatus,
        drivingLicenseStatus,
        startDate,
        endDate,
        keyword,
      } = ctx.query;

      const query = {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        status: status as UserStatus,
        memberType: memberType as MemberType,
        realNameStatus: realNameStatus as AuthStatus,
        drivingLicenseStatus: drivingLicenseStatus as AuthStatus,
        startDate,
        endDate,
        keyword,
      };

      const buffer = await userManagementService.exportUsers(query);

      // 设置响应头
      const filename = `用户列表_${new Date().toISOString().substring(0, 10)}.xlsx`;
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

      ctx.body = buffer;
    } catch (error: any) {
      ctx.error(400, error.message || '导出用户数据失败');
    }
  }
}
