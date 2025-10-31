import { AppDataSource } from '../config/database';
import { CampsiteReview } from '../entities/CampsiteReview';
import { CampsiteBooking, BookingStatus } from '../entities/CampsiteBooking';
import { Campsite } from '../entities/Campsite';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 评价DTO接口
 */
export interface CreateReviewDTO {
  userId: string;
  campsiteId: string;
  bookingId: string;
  overallRating: number;
  facilityRating: number;
  serviceRating: number;
  hygieneRating: number;
  locationRating: number;
  content?: string;
  images?: string[];
}

export interface ReviewListDTO {
  page?: number;
  pageSize?: number;
  campsiteId?: string;
  userId?: string;
  sortBy?: 'createdAt' | 'overallRating';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 营地评价服务
 */
export class CampsiteReviewService {
  private reviewRepository = AppDataSource.getRepository(CampsiteReview);
  private bookingRepository = AppDataSource.getRepository(CampsiteBooking);
  private campsiteRepository = AppDataSource.getRepository(Campsite);

  /**
   * 创建评价
   */
  async createReview(data: CreateReviewDTO): Promise<CampsiteReview> {
    try {
      // 验证预订
      const booking = await this.bookingRepository.findOne({
        where: { id: data.bookingId },
      });

      if (!booking) {
        throw new Error('预订不存在');
      }

      if (booking.userId !== data.userId) {
        throw new Error('无权评价此预订');
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new Error('只能评价已完成的预订');
      }

      // 检查是否已评价
      const existingReview = await this.reviewRepository.findOne({
        where: { bookingId: data.bookingId },
      });

      if (existingReview) {
        throw new Error('该预订已评价');
      }

      // 验证评分范围
      const ratings = [
        data.overallRating,
        data.facilityRating,
        data.serviceRating,
        data.hygieneRating,
        data.locationRating,
      ];

      for (const rating of ratings) {
        if (rating < 1 || rating > 5) {
          throw new Error('评分必须在1-5之间');
        }
      }

      // 创建评价
      const review = this.reviewRepository.create({
        id: uuidv4(),
        userId: data.userId,
        campsiteId: data.campsiteId,
        bookingId: data.bookingId,
        overallRating: data.overallRating,
        facilityRating: data.facilityRating,
        serviceRating: data.serviceRating,
        hygieneRating: data.hygieneRating,
        locationRating: data.locationRating,
        content: data.content,
        images: data.images,
        isVisible: true,
      });

      await this.reviewRepository.save(review);

      // 更新营地平均评分和评价数量
      await this.updateCampsiteRating(data.campsiteId);

      logger.info(`营地评价创建成功: ${review.id}`);
      return review;
    } catch (error) {
      logger.error('创建营地评价失败:', error);
      throw error;
    }
  }

  /**
   * 获取评价列表
   */
  async getReviewList(params: ReviewListDTO): Promise<{
    list: CampsiteReview[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .where('review.isVisible = :isVisible', { isVisible: true });

      // 筛选条件
      if (params.campsiteId) {
        queryBuilder.andWhere('review.campsiteId = :campsiteId', {
          campsiteId: params.campsiteId,
        });
      }

      if (params.userId) {
        queryBuilder.andWhere('review.userId = :userId', { userId: params.userId });
      }

      // 排序
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [list, total] = await queryBuilder.getManyAndCount();

      return { list, total, page, pageSize };
    } catch (error) {
      logger.error('获取评价列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除评价（管理端）
   */
  async deleteReview(id: string): Promise<void> {
    try {
      const review = await this.reviewRepository.findOne({ where: { id } });

      if (!review) {
        throw new Error('评价不存在');
      }

      const campsiteId = review.campsiteId;

      await this.reviewRepository.remove(review);

      // 更新营地平均评分和评价数量
      await this.updateCampsiteRating(campsiteId);

      logger.info(`营地评价删除成功: ${id}`);
    } catch (error) {
      logger.error('删除营地评价失败:', error);
      throw error;
    }
  }

  /**
   * 更新营地平均评分和评价数量
   */
  private async updateCampsiteRating(campsiteId: string): Promise<void> {
    try {
      const reviews = await this.reviewRepository.find({
        where: { campsiteId, isVisible: true },
      });

      const reviewCount = reviews.length;
      let averageRating = 0;

      if (reviewCount > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
        averageRating = Math.round((totalRating / reviewCount) * 10) / 10;
      }

      await this.campsiteRepository.update(campsiteId, {
        averageRating,
        reviewCount,
      });

      logger.info(`营地评分更新: ${campsiteId} -> ${averageRating} (${reviewCount}条)`);
    } catch (error) {
      logger.error('更新营地评分失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}

