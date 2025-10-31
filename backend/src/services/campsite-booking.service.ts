import { AppDataSource } from '../config/database';
import { CampsiteBooking, BookingStatus } from '../entities/CampsiteBooking';
import { Campsite, BookingMode } from '../entities/Campsite';
import { CampsiteSpot } from '../entities/CampsiteSpot';
import { WalletService } from './wallet.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 预订DTO接口
 */
export interface CreateBookingDTO {
  userId: string;
  campsiteId: string;
  spotId: string;
  checkInDate: Date;
  checkOutDate: Date;
  spotQuantity: number;
  contactName: string;
  contactPhone: string;
  remark?: string;
  couponId?: string;
}

export interface BookingListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  campsiteId?: string;
  status?: BookingStatus;
  checkInDateStart?: Date;
  checkInDateEnd?: Date;
  keyword?: string;
  sortBy?: 'createdAt' | 'checkInDate';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 营地预订服务
 */
export class CampsiteBookingService {
  private bookingRepository = AppDataSource.getRepository(CampsiteBooking);
  private campsiteRepository = AppDataSource.getRepository(Campsite);
  private spotRepository = AppDataSource.getRepository(CampsiteSpot);
  private walletService = new WalletService();

  /**
   * 创建预订
   */
  async createBooking(data: CreateBookingDTO): Promise<CampsiteBooking> {
    try {
      // 1. 验证营地
      const campsite = await this.campsiteRepository.findOne({
        where: { id: data.campsiteId },
      });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      if (campsite.bookingMode !== BookingMode.REALTIME) {
        throw new Error('该营地不支持实时预订，请使用咨询模式');
      }

      // 2. 验证营位
      const spot = await this.spotRepository.findOne({
        where: { id: data.spotId },
      });

      if (!spot) {
        throw new Error('营位不存在');
      }

      if (!spot.isAvailable) {
        throw new Error('营位不可用');
      }

      // 3. 计算入住天数
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      if (nights < 1) {
        throw new Error('入住天数至少为1晚');
      }

      if (nights > 30) {
        throw new Error('入住天数最多为30晚');
      }

      // 4. 计算费用
      const spotPrice = spot.pricePerNight;
      const spotAmount = spotPrice * nights * data.spotQuantity;
      let couponAmount = 0;

      // TODO: 处理优惠券逻辑
      if (data.couponId) {
        // 验证和计算优惠券抵扣金额
        couponAmount = 0;
      }

      const totalAmount = spotAmount - couponAmount;

      // 5. 生成预订编号
      const bookingNo = await this.generateBookingNo();

      // 6. 创建预订记录
      const booking = this.bookingRepository.create({
        id: uuidv4(),
        bookingNo,
        userId: data.userId,
        campsiteId: data.campsiteId,
        spotId: data.spotId,
        status: BookingStatus.PENDING,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights,
        spotQuantity: data.spotQuantity,
        spotPrice,
        spotAmount,
        couponAmount,
        totalAmount,
        couponId: data.couponId,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        remark: data.remark,
        refundAmount: 0,
      });

      await this.bookingRepository.save(booking);

      // 7. 钱包扣款
      await this.walletService.consume({
        userId: data.userId,
        amount: totalAmount,
        relatedId: booking.id,
        relatedType: 'campsite_booking',
        description: `营地预订: ${campsite.name}`,
      });

      // 8. 更新预订状态为已支付
      booking.status = BookingStatus.PAID;
      booking.paymentMethod = 'wallet';
      booking.paidAt = new Date();
      await this.bookingRepository.save(booking);

      // 9. 更新营地预订次数
      await this.campsiteRepository.update(data.campsiteId, {
        bookingCount: () => 'bookingCount + 1',
      });

      logger.info(`营地预订创建成功: ${booking.id} - ${booking.bookingNo}`);
      return booking;
    } catch (error) {
      logger.error('创建营地预订失败:', error);
      throw error;
    }
  }

  /**
   * 取消预订
   */
  async cancelBooking(id: string, userId: string, reason?: string): Promise<CampsiteBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['campsite'],
      });

      if (!booking) {
        throw new Error('预订不存在');
      }

      if (booking.userId !== userId) {
        throw new Error('无权取消此预订');
      }

      if (booking.status !== BookingStatus.PAID) {
        throw new Error('只能取消已支付的预订');
      }

      // 计算退款金额
      const now = new Date();
      const checkInDate = new Date(booking.checkInDate);
      const hoursBeforeCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      let refundAmount = 0;

      if (hoursBeforeCheckIn >= 24) {
        // 入住前24小时以上取消，全额退款
        refundAmount = booking.totalAmount;
      } else if (hoursBeforeCheckIn > 0) {
        // 入住前24小时内取消，扣除30%违约金
        refundAmount = booking.totalAmount * 0.7;
      } else {
        // 入住后不可取消
        throw new Error('入住后不可取消预订');
      }

      // 更新预订状态
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = now;
      booking.cancelReason = reason;
      booking.refundAmount = refundAmount;
      await this.bookingRepository.save(booking);

      // 退款到钱包
      if (refundAmount > 0) {
        await this.walletService.refund(
          userId,
          refundAmount,
          booking.id,
          'campsite_booking',
          `营地预订取消退款: ${booking.bookingNo}`
        );

        booking.status = BookingStatus.REFUNDED;
        booking.refundedAt = now;
        await this.bookingRepository.save(booking);
      }

      logger.info(`营地预订取消成功: ${id}, 退款金额: ${refundAmount}`);
      return booking;
    } catch (error) {
      logger.error('取消营地预订失败:', error);
      throw error;
    }
  }

  /**
   * 获取预订列表
   */
  async getBookingList(params: BookingListDTO): Promise<{
    list: CampsiteBooking[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.campsite', 'campsite')
        .leftJoinAndSelect('booking.spot', 'spot');

      // 筛选条件
      if (params.userId) {
        queryBuilder.andWhere('booking.userId = :userId', { userId: params.userId });
      }

      if (params.campsiteId) {
        queryBuilder.andWhere('booking.campsiteId = :campsiteId', {
          campsiteId: params.campsiteId,
        });
      }

      if (params.status) {
        queryBuilder.andWhere('booking.status = :status', { status: params.status });
      }

      if (params.checkInDateStart) {
        queryBuilder.andWhere('booking.checkInDate >= :checkInDateStart', {
          checkInDateStart: params.checkInDateStart,
        });
      }

      if (params.checkInDateEnd) {
        queryBuilder.andWhere('booking.checkInDate <= :checkInDateEnd', {
          checkInDateEnd: params.checkInDateEnd,
        });
      }

      if (params.keyword) {
        queryBuilder.andWhere('booking.bookingNo LIKE :keyword OR campsite.name LIKE :keyword', {
          keyword: `%${params.keyword}%`,
        });
      }

      // 排序
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`booking.${sortBy}`, sortOrder);

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [list, total] = await queryBuilder.getManyAndCount();

      return { list, total, page, pageSize };
    } catch (error) {
      logger.error('获取预订列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取预订详情
   */
  async getBookingById(id: string): Promise<CampsiteBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['campsite', 'spot', 'user'],
      });

      if (!booking) {
        throw new Error('预订不存在');
      }

      return booking;
    } catch (error) {
      logger.error('获取预订详情失败:', error);
      throw error;
    }
  }

  /**
   * 生成预订编号
   */
  private async generateBookingNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `CB${year}${month}${day}${random}`;
  }
}
