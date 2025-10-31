import {
  CrowdfundingShareService,
  PurchaseSharesDTO,
  ShareListDTO,
  SignAgreementDTO,
} from '../services/crowdfunding-share.service';
import { ProjectStatus } from '../entities/CrowdfundingProject';
import { ShareStatus } from '../entities/CrowdfundingShare';
import { logger } from '../utils/logger';

/**
 * 众筹份额控制器
 */
export class CrowdfundingShareController {
  private shareService = new CrowdfundingShareService();

  /**
   * 购买份额（用户端）
   */
  purchaseShares = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const { projectId, shareCount } = ctx.request.body;

      // 参数验证
      if (!projectId || !shareCount) {
        ctx.error(400, '项目ID和份额数量为必填项');
        return;
      }

      if (shareCount <= 0) {
        ctx.error(400, '份额数量必须大于0');
        return;
      }

      const data: PurchaseSharesDTO = {
        userId,
        projectId,
        shareCount: parseInt(shareCount),
      };

      const share = await this.shareService.purchaseShares(data);

      ctx.success(share, '份额购买成功');
    } catch (error: any) {
      logger.error('Failed to purchase shares:', error);
      ctx.error(500, error.message || '购买份额失败');
    }
  };

  /**
   * 获取我的份额列表（用户端）
   */
  getMyShares = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const { page, pageSize, projectStatus } = ctx.query;

      const params: ShareListDTO = {
        userId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        projectStatus: projectStatus as ProjectStatus,
      };

      const result = await this.shareService.getMyShares(params);

      ctx.success(result, '获取我的份额列表成功');
    } catch (error: any) {
      logger.error('Failed to get my shares:', error);
      ctx.error(500, error.message || '获取我的份额列表失败');
    }
  };

  /**
   * 获取份额详情（用户端）
   */
  getShareById = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const share = await this.shareService.getShareById(id);

      if (!share) {
        ctx.error(404, '份额不存在');
        return;
      }

      // 验证份额所有权
      if (share.userId !== userId) {
        ctx.error(403, '无权访问该份额');
        return;
      }

      ctx.success(share, '获取份额详情成功');
    } catch (error: any) {
      logger.error('Failed to get share details:', error);
      ctx.error(500, error.message || '获取份额详情失败');
    }
  };

  /**
   * 签署协议（用户端）
   */
  signAgreement = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { agreementUrl } = ctx.request.body;

      // 参数验证
      if (!agreementUrl) {
        ctx.error(400, '协议URL为必填项');
        return;
      }

      // 验证份额所有权
      const share = await this.shareService.getShareById(id);
      if (!share) {
        ctx.error(404, '份额不存在');
        return;
      }

      if (share.userId !== userId) {
        ctx.error(403, '无权操作该份额');
        return;
      }

      const data: SignAgreementDTO = {
        shareId: id,
        agreementUrl,
      };

      const updatedShare = await this.shareService.signAgreement(data);

      ctx.success(updatedShare, '协议签署成功');
    } catch (error: any) {
      logger.error('Failed to sign agreement:', error);
      ctx.error(500, error.message || '签署协议失败');
    }
  };

  /**
   * 获取所有份额列表（管理端）
   */
  getAllShares = async (ctx: any) => {
    try {
      const { page, pageSize, status, projectId, userId } = ctx.query;

      const params = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        status: status as ShareStatus,
        projectId,
        userId,
      };

      const result = await this.shareService.getAllShares(params);

      ctx.success(result, '获取所有份额列表成功');
    } catch (error: any) {
      logger.error('Failed to get all shares:', error);
      ctx.error(500, error.message || '获取所有份额列表失败');
    }
  };

  /**
   * 获取份额详情（管理端）
   */
  getShareDetails = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const share = await this.shareService.getShareById(id);

      if (!share) {
        ctx.error(404, '份额不存在');
        return;
      }

      ctx.success(share, '获取份额详情成功');
    } catch (error: any) {
      logger.error('Failed to get share details:', error);
      ctx.error(500, error.message || '获取份额详情失败');
    }
  };

  /**
   * 获取份额统计（管理端）
   */
  getShareStats = async (ctx: any) => {
    try {
      const stats = await this.shareService.getShareStats();

      ctx.success(stats, '获取份额统计成功');
    } catch (error: any) {
      logger.error('Failed to get share stats:', error);
      ctx.error(500, error.message || '获取份额统计失败');
    }
  };
}

