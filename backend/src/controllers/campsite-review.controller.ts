import {
  CampsiteReviewService,
  CreateReviewDTO,
  ReviewListDTO,
} from '../services/campsite-review.service';
import { logger } from '../utils/logger';

/**
 * 营地评价控制器
 */
export class CampsiteReviewController {
  private reviewService = new CampsiteReviewService();

  /**
   * 提交评价（用户端）
   * POST /api/campsites/reviews
   */
  createReview = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const data: CreateReviewDTO = {
        ...ctx.request.body,
        userId,
      };

      // 验证必填字段
      if (
        !data.campsiteId ||
        !data.bookingId ||
        !data.overallRating ||
        !data.facilityRating ||
        !data.serviceRating ||
        !data.hygieneRating ||
        !data.locationRating
      ) {
        ctx.error(400, '缺少必填参数');
        return;
      }

      const review = await this.reviewService.createReview(data);

      ctx.success(review, '提交评价成功');
    } catch (error: any) {
      logger.error('Failed to create review:', error);
      ctx.error(500, error.message || '提交评价失败');
    }
  };

  /**
   * 获取营地评价列表（用户端）
   * GET /api/campsites/:campsiteId/reviews
   */
  getReviewsByCampsite = async (ctx: any) => {
    try {
      const { campsiteId } = ctx.params;
      const { page, pageSize, sortBy, sortOrder } = ctx.query;

      const params: ReviewListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        campsiteId,
        sortBy: sortBy as 'createdAt' | 'overallRating',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.reviewService.getReviewList(params);

      ctx.success(result, '获取评价列表成功');
    } catch (error: any) {
      logger.error('Failed to get reviews:', error);
      ctx.error(500, error.message || '获取评价列表失败');
    }
  };

  // ==================== 管理端 API ====================

  /**
   * 获取所有评价（管理端）
   * GET /api/admin/campsites/reviews
   */
  adminGetReviews = async (ctx: any) => {
    try {
      const { page, pageSize, campsiteId, sortBy, sortOrder } = ctx.query;

      const params: ReviewListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        campsiteId,
        sortBy: sortBy as 'createdAt' | 'overallRating',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.reviewService.getReviewList(params);

      ctx.success(result, '获取评价列表成功');
    } catch (error: any) {
      logger.error('Failed to get reviews:', error);
      ctx.error(500, error.message || '获取评价列表失败');
    }
  };

  /**
   * 删除评价（管理端）
   * DELETE /api/admin/campsites/reviews/:id
   */
  adminDeleteReview = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.reviewService.deleteReview(id);

      ctx.success(null, '删除评价成功');
    } catch (error: any) {
      logger.error('Failed to delete review:', error);
      ctx.error(500, error.message || '删除评价失败');
    }
  };
}

