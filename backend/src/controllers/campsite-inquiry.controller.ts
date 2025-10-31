import {
  CampsiteInquiryService,
  CreateInquiryDTO,
  UpdateInquiryDTO,
  InquiryListDTO,
} from '../services/campsite-inquiry.service';
import { InquiryStatus } from '../entities/CampsiteInquiry';
import { logger } from '../utils/logger';

/**
 * 营地咨询控制器
 */
export class CampsiteInquiryController {
  private inquiryService = new CampsiteInquiryService();

  /**
   * 提交咨询（用户端）
   * POST /api/campsites/inquiries
   */
  createInquiry = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const data: CreateInquiryDTO = {
        ...ctx.request.body,
        userId,
      };

      // 验证必填字段
      if (!data.campsiteId || !data.contactName || !data.contactPhone || !data.content) {
        ctx.error(400, '缺少必填参数');
        return;
      }

      const inquiry = await this.inquiryService.createInquiry(data);

      ctx.success(inquiry, '提交咨询成功');
    } catch (error: any) {
      logger.error('Failed to create inquiry:', error);
      ctx.error(500, error.message || '提交咨询失败');
    }
  };

  /**
   * 获取我的咨询列表（用户端）
   * GET /api/campsites/inquiries/my
   */
  getMyInquiries = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { page, pageSize, status } = ctx.query;

      const params: InquiryListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        userId,
        status: status as InquiryStatus,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      const result = await this.inquiryService.getInquiryList(params);

      ctx.success(result, '获取咨询列表成功');
    } catch (error: any) {
      logger.error('Failed to get my inquiries:', error);
      ctx.error(500, error.message || '获取咨询列表失败');
    }
  };

  // ==================== 管理端 API ====================

  /**
   * 获取所有咨询（管理端）
   * GET /api/admin/campsites/inquiries
   */
  adminGetInquiries = async (ctx: any) => {
    try {
      const { page, pageSize, campsiteId, status, keyword } = ctx.query;

      const params: InquiryListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        campsiteId,
        status: status as InquiryStatus,
        keyword,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      const result = await this.inquiryService.getInquiryList(params);

      ctx.success(result, '获取咨询列表成功');
    } catch (error: any) {
      logger.error('Failed to get inquiries:', error);
      ctx.error(500, error.message || '获取咨询列表失败');
    }
  };

  /**
   * 获取咨询详情（管理端）
   * GET /api/admin/campsites/inquiries/:id
   */
  adminGetInquiryById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const inquiry = await this.inquiryService.getInquiryById(id);

      ctx.success(inquiry, '获取咨询详情成功');
    } catch (error: any) {
      logger.error('Failed to get inquiry details:', error);
      ctx.error(500, error.message || '获取咨询详情失败');
    }
  };

  /**
   * 更新咨询状态（管理端）
   * PUT /api/admin/campsites/inquiries/:id
   */
  adminUpdateInquiry = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data: UpdateInquiryDTO = ctx.request.body;

      const adminId = ctx.state.user?.id;
      if (data.status && !data.processedBy) {
        data.processedBy = adminId;
      }

      const inquiry = await this.inquiryService.updateInquiry(id, data);

      ctx.success(inquiry, '更新咨询成功');
    } catch (error: any) {
      logger.error('Failed to update inquiry:', error);
      ctx.error(500, error.message || '更新咨询失败');
    }
  };
}

