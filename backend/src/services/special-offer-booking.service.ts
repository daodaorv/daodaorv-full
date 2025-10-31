import { AppDataSource } from '../config/database';
import { SpecialOfferBooking, SpecialOfferBookingStatus } from '../entities/SpecialOfferBooking';
import { SpecialOffer, SpecialOfferStatus } from '../entities/SpecialOffer';
import { WalletService } from './wallet.service';
import { SpecialOfferService } from './special-offer.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 预订DTO接口
 */
export interface CreateSpecialOfferBookingDTO {
  userId: string;
  offerId: string;
  pickupDate: Date;
  vehicleModelId: string;
  additionalServices?: {
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
  }[];
}

export interface SpecialOfferBookingListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  offerId?: string;
  status?: SpecialOfferBookingStatus;
}

/**
 * 特惠订单服务
 */
export class SpecialOfferBookingService {
  private bookingRepository = AppDataSource.getRepository(SpecialOfferBooking);
  private offerRepository = AppDataSource.getRepository(SpecialOffer);
  private walletService = new WalletService();
  private offerService = new SpecialOfferService();

  /**
   * 创建特惠订单
   */
  async createBooking(data: CreateSpecialOfferBookingDTO): Promise<SpecialOfferBooking> {
    try {
      // 验证套餐
      const offer = await this.offerRepository.findOne({
        where: { id: data.offerId },
      });
      if (!offer) {
        throw new Error('特惠套餐不存在');
      }

      // 验证套餐状态
      if (offer.status !== SpecialOfferStatus.ACTIVE) {
        throw new Error('套餐未启用或已下架');
      }

      // 验证活动时间
      const now = new Date();
      if (new Date(offer.endDate) < now) {
        throw new Error('套餐活动已结束');
      }

      // 验证库存
      if (offer.remainingStock <= 0) {
        throw new Error('套餐库存不足');
      }

      // 验证取车日期
      const pickupDate = new Date(data.pickupDate);
      if (pickupDate < new Date(offer.startDate) || pickupDate > new Date(offer.endDate)) {
        throw new Error('取车日期必须在活动期限内');
      }

      // 验证车型
      if (!offer.vehicleModelIds.includes(data.vehicleModelId)) {
        throw new Error('所选车型不在套餐可选范围内');
      }

      // 计算还车日期（取车日期 + 固定租期）
      const returnDate = new Date(pickupDate);
      returnDate.setDate(returnDate.getDate() + offer.fixedDays);

      // 计算总金额
      let totalAmount = Number(offer.offerPrice);

      // 加上附加服务费用
      if (data.additionalServices && data.additionalServices.length > 0) {
        for (const service of data.additionalServices) {
          totalAmount += Number(service.price) * service.quantity;
        }
      }

      // 生成订单号
      const bookingNo = this.generateBookingNo();

      // 创建订单记录
      const booking = this.bookingRepository.create({
        id: uuidv4(),
        bookingNo,
        userId: data.userId,
        offerId: data.offerId,
        pickupDate: data.pickupDate,
        returnDate,
        offerPrice: offer.offerPrice,
        additionalServices: data.additionalServices,
        totalAmount,
        status: SpecialOfferBookingStatus.PENDING,
      });

      await this.bookingRepository.save(booking);

      // 扣减库存
      await this.offerService.decreaseStock(data.offerId);

      // 扣款
      await this.walletService.consume({
        userId: data.userId,
        amount: totalAmount,
        relatedId: booking.id,
        relatedType: 'special_offer_booking',
        description: `特惠租车：${offer.name}`,
      });

      // 更新订单状态为已支付
      booking.status = SpecialOfferBookingStatus.PAID;
      await this.bookingRepository.save(booking);

      logger.info(`特惠订单创建成功: ${booking.bookingNo} - 用户: ${data.userId}`);
      return booking;
    } catch (error) {
      logger.error('创建特惠订单失败:', error);
      throw error;
    }
  }

  /**
   * 取消订单
   */
  async cancelBooking(
    id: string,
    userId: string,
    cancelReason?: string
  ): Promise<SpecialOfferBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['offer'],
      });

      if (!booking) {
        throw new Error('订单不存在');
      }

      if (booking.userId !== userId) {
        throw new Error('无权操作此订单');
      }

      // 只有待支付和已支付状态可以取消
      if (
        booking.status !== SpecialOfferBookingStatus.PENDING &&
        booking.status !== SpecialOfferBookingStatus.PAID
      ) {
        throw new Error('当前订单状态不允许取消');
      }

      // 如果已支付，退款
      if (booking.status === SpecialOfferBookingStatus.PAID) {
        await this.walletService.refund(
          booking.userId,
          Number(booking.totalAmount),
          booking.id,
          'special_offer_booking',
          `特惠订单取消退款：${booking.bookingNo}`
        );
      }

      // 恢复库存
      await this.offerService.increaseStock(booking.offerId);

      // 更新订单状态
      booking.status = SpecialOfferBookingStatus.CANCELLED;
      booking.cancelReason = cancelReason;
      await this.bookingRepository.save(booking);

      logger.info(`特惠订单取消成功: ${booking.bookingNo}`);
      return booking;
    } catch (error) {
      logger.error('取消特惠订单失败:', error);
      throw error;
    }
  }

  /**
   * 分配车辆（管理端）
   */
  async assignVehicle(id: string, vehicleId: string): Promise<SpecialOfferBooking> {
    try {
      const booking = await this.bookingRepository.findOne({ where: { id } });

      if (!booking) {
        throw new Error('订单不存在');
      }

      if (booking.status !== SpecialOfferBookingStatus.PAID) {
        throw new Error('只有已支付的订单才能分配车辆');
      }

      booking.vehicleId = vehicleId;
      booking.status = SpecialOfferBookingStatus.CONFIRMED;
      await this.bookingRepository.save(booking);

      logger.info(`特惠订单分配车辆成功: ${booking.bookingNo} -> 车辆: ${vehicleId}`);
      return booking;
    } catch (error) {
      logger.error('分配车辆失败:', error);
      throw error;
    }
  }

  /**
   * 完成订单
   */
  async completeBooking(id: string): Promise<SpecialOfferBooking> {
    try {
      const booking = await this.bookingRepository.findOne({ where: { id } });

      if (!booking) {
        throw new Error('订单不存在');
      }

      if (booking.status !== SpecialOfferBookingStatus.CONFIRMED) {
        throw new Error('只有已确认的订单才能完成');
      }

      booking.status = SpecialOfferBookingStatus.COMPLETED;
      await this.bookingRepository.save(booking);

      logger.info(`特惠订单完成: ${booking.bookingNo}`);
      return booking;
    } catch (error) {
      logger.error('完成订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单列表
   */
  async getBookingList(params: SpecialOfferBookingListDTO): Promise<{
    bookings: SpecialOfferBooking[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const { page = 1, pageSize = 10, userId, offerId, status } = params;

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.offer', 'offer')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.vehicle', 'vehicle');

      // 筛选条件
      if (userId) {
        queryBuilder.andWhere('booking.userId = :userId', { userId });
      }

      if (offerId) {
        queryBuilder.andWhere('booking.offerId = :offerId', { offerId });
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

      logger.info(`获取特惠订单列表成功: ${bookings.length}/${total}`);
      return { bookings, total, page, pageSize };
    } catch (error) {
      logger.error('获取特惠订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单详情
   */
  async getBookingById(id: string): Promise<SpecialOfferBooking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['offer', 'user', 'vehicle'],
      });

      if (!booking) {
        throw new Error('订单不存在');
      }

      logger.info(`获取特惠订单详情成功: ${booking.id}`);
      return booking;
    } catch (error) {
      logger.error('获取特惠订单详情失败:', error);
      throw error;
    }
  }

  /**
   * 生成订单号
   */
  private generateBookingNo(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `SOB${timestamp}${random}`;
  }
}
