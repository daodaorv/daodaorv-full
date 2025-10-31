import { AppDataSource } from '../config/database';
import { TourBooking, TourBookingStatus } from '../entities/TourBooking';
import { TourBatch } from '../entities/TourBatch';
import { TourRoute } from '../entities/TourRoute';
import { WalletService } from './wallet.service';
import { TourBatchService } from './tour-batch.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 预订DTO接口
 */
export interface CreateTourBookingDTO {
  userId: string;
  routeId: string;
  batchId: string;
  adultCount: number;
  childCount?: number;
  needButler?: boolean;
  contactName: string;
  contactPhone: string;
  specialRequests?: string;
}

export interface TourBookingListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  routeId?: string;
  batchId?: string;
  status?: TourBookingStatus;
}

/**
 * 旅游预订服务
 */
export class TourBookingService {
  private bookingRepository = AppDataSource.getRepository(TourBooking);
  private batchRepository = AppDataSource.getRepository(TourBatch);
  private routeRepository = AppDataSource.getRepository(TourRoute);
  private walletService = new WalletService();
  private batchService = new TourBatchService();

  /**
   * 创建预订
   */
  async createBooking(data: CreateTourBookingDTO): Promise<TourBooking> {
    try {
      // 验证路线和批次
      const route = await this.routeRepository.findOne({
        where: { id: data.routeId },
      });
      if (!route) {
        throw new Error('旅游路线不存在');
      }

      const batch = await this.batchRepository.findOne({
        where: { id: data.batchId },
      });
      if (!batch) {
        throw new Error('出发批次不存在');
      }

      // 验证批次是否属于该路线
      if (batch.routeId !== data.routeId) {
        throw new Error('批次与路线不匹配');
      }

      // 验证批次库存
      const totalPeople = data.adultCount + (data.childCount || 0);
      if (batch.bookedCount + totalPeople > batch.stock) {
        throw new Error('批次库存不足');
      }

      // 计算总金额
      let totalAmount =
        data.adultCount * Number(route.adultPrice) +
        (data.childCount || 0) * Number(route.childPrice);

      // 如果需要管家服务，加上管家费用
      if (data.needButler && route.butlerFeePerDay) {
        totalAmount += Number(route.butlerFeePerDay) * route.days;
      }

      // 生成预订单号
      const bookingNo = this.generateBookingNo();

      // 创建预订记录
      const booking = this.bookingRepository.create({
        id: uuidv4(),
        bookingNo,
        userId: data.userId,
        routeId: data.routeId,
        batchId: data.batchId,
        adultCount: data.adultCount,
        childCount: data.childCount || 0,
        needButler: data.needButler || false,
        totalAmount,
        refundAmount: 0,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        specialRequests: data.specialRequests,
        status: TourBookingStatus.PENDING,
      });

      await this.bookingRepository.save(booking);

      // 扣减批次库存
      batch.bookedCount += totalPeople;
      await this.batchRepository.save(batch);

      // 检查并更新成团状态
      await this.batchService.checkAndUpdateGroupStatus(batch.id);

      // 扣款
      await this.walletService.consume({
        userId: data.userId,
        amount: totalAmount,
        relatedId: booking.id,
        relatedType: 'tour_booking',
        description: `旅游预订：${route.name}`,
      });

      // 更新预订状态为已支付
      booking.status = TourBookingStatus.PAID;
      await this.bookingRepository.save(booking);

      logger.info(`旅游预订创建成功: ${booking.bookingNo} - 用户: ${data.userId}`);
      return booking;
    } catch (error) {
      logger.error('创建旅游预订失败:', error);
      throw error;
    }
  }

  /**
   * 取消预订
   */
  async cancelBooking(id: string, userId: string): Promise<TourBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['route', 'batch'],
      });

      if (!booking) {
        throw new Error('预订不存在');
      }

      if (booking.userId !== userId) {
        throw new Error('无权操作此预订');
      }

      // 只有待支付和已支付状态可以取消
      if (
        booking.status !== TourBookingStatus.PENDING &&
        booking.status !== TourBookingStatus.PAID
      ) {
        throw new Error('当前预订状态不可取消');
      }

      // 计算退款金额
      let refundAmount = 0;
      if (booking.status === TourBookingStatus.PAID) {
        const departureDate = new Date(booking.batch.departureDate);
        const now = new Date();
        const daysUntilDeparture = Math.ceil(
          (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDeparture >= 7) {
          // 出发前7天以上：退款100%
          refundAmount = Number(booking.totalAmount);
        } else if (daysUntilDeparture >= 3) {
          // 出发前3-7天：退款70%
          refundAmount = Number(booking.totalAmount) * 0.7;
        } else if (daysUntilDeparture >= 0) {
          // 出发前3天内：退款50%
          refundAmount = Number(booking.totalAmount) * 0.5;
        } else {
          // 出发当天或之后：不退款
          refundAmount = 0;
        }

        // 退款到钱包
        if (refundAmount > 0) {
          await this.walletService.refund(
            booking.userId,
            refundAmount,
            booking.id,
            'tour_booking',
            `旅游预订取消退款：${booking.route.name}`
          );
        }
      }

      // 恢复批次库存
      const totalPeople = booking.adultCount + booking.childCount;
      booking.batch.bookedCount -= totalPeople;
      await this.batchRepository.save(booking.batch);

      // 更新预订状态
      booking.status =
        refundAmount > 0
          ? TourBookingStatus.REFUNDED
          : TourBookingStatus.CANCELLED;
      booking.refundAmount = refundAmount;
      await this.bookingRepository.save(booking);

      logger.info(`旅游预订取消成功: ${booking.bookingNo} - 退款: ${refundAmount}`);
      return booking;
    } catch (error) {
      logger.error('取消旅游预订失败:', error);
      throw error;
    }
  }

  /**
   * 获取预订列表
   */
  async getBookingList(params: TourBookingListDTO): Promise<{
    bookings: TourBooking[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        userId,
        routeId,
        batchId,
        status,
      } = params;

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.route', 'route')
        .leftJoinAndSelect('booking.batch', 'batch')
        .leftJoinAndSelect('booking.user', 'user');

      // 筛选条件
      if (userId) {
        queryBuilder.andWhere('booking.userId = :userId', { userId });
      }

      if (routeId) {
        queryBuilder.andWhere('booking.routeId = :routeId', { routeId });
      }

      if (batchId) {
        queryBuilder.andWhere('booking.batchId = :batchId', { batchId });
      }

      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }

      // 排序
      queryBuilder.orderBy('booking.createdAt', 'DESC');

      // 分页
      const [bookings, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      logger.info(`获取旅游预订列表成功: ${bookings.length}/${total}`);
      return { bookings, total, page, pageSize };
    } catch (error) {
      logger.error('获取旅游预订列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取预订详情
   */
  async getBookingById(id: string): Promise<TourBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['route', 'batch', 'user'],
      });

      if (!booking) {
        throw new Error('预订不存在');
      }

      logger.info(`获取旅游预订详情成功: ${booking.id}`);
      return booking;
    } catch (error) {
      logger.error('获取旅游预订详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新预订状态（管理端）
   */
  async updateBookingStatus(
    id: string,
    status: TourBookingStatus
  ): Promise<TourBooking> {
    try {
      const booking = await this.bookingRepository.findOne({ where: { id } });
      if (!booking) {
        throw new Error('预订不存在');
      }

      booking.status = status;
      await this.bookingRepository.save(booking);

      logger.info(`旅游预订状态更新成功: ${booking.id} -> ${status}`);
      return booking;
    } catch (error) {
      logger.error('更新旅游预订状态失败:', error);
      throw error;
    }
  }

  /**
   * 生成预订单号
   */
  private generateBookingNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `TB${year}${month}${day}${random}`;
  }
}

