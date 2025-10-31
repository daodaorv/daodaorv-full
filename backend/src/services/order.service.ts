import { Repository, Between, Like, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus, PaymentStatus, OrderType } from '../entities/Order';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';
import { User } from '../entities/User';
import { generateOrderNumber } from '../utils/order-number';
import { RefundService } from './refund.service';
import { logger } from '../utils/logger';

/**
 * 创建订单DTO
 */
export interface CreateOrderDTO {
  vehicleId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pickupStoreId?: string;
  returnStoreId?: string;
  needInsurance?: boolean;
  additionalServices?: Array<{ name: string; price: number }>;
}

/**
 * 订单查询DTO
 */
export interface OrderQueryDTO {
  status?: OrderStatus;
  orderType?: OrderType;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 取消订单DTO
 */
export interface CancelOrderDTO {
  reason?: string;
}

/**
 * 订单服务类
 */
export class OrderService {
  private orderRepository: Repository<Order>;
  private vehicleRepository: Repository<Vehicle>;
  private userRepository: Repository<User>;
  private refundService: RefundService;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
    this.userRepository = AppDataSource.getRepository(User);
    this.refundService = new RefundService();
  }

  /**
   * 创建订单
   */
  async createOrder(userId: string, dto: CreateOrderDTO): Promise<Order> {
    // 1. 验证用户
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 验证车辆
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId },
      relations: ['vehicleModel'],
    });
    if (!vehicle) {
      throw new Error('车辆不存在');
    }
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new Error('车辆当前不可用');
    }

    // 3. 计算租赁天数
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 验证日期
    if (startDate < now) {
      throw new Error('开始日期不能早于今天');
    }
    if (endDate <= startDate) {
      throw new Error('结束日期必须晚于开始日期');
    }

    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (rentalDays < 1) {
      throw new Error('租赁天数至少为1天');
    }

    // 4. 检查车辆时间冲突
    const conflictOrders = await this.orderRepository.find({
      where: {
        vehicleId: dto.vehicleId,
        status: In([OrderStatus.PAID, OrderStatus.PICKUP, OrderStatus.USING, OrderStatus.RETURN]),
      },
    });

    for (const existingOrder of conflictOrders) {
      const existingStart = new Date(existingOrder.startDate);
      const existingEnd = new Date(existingOrder.endDate);

      if (
        (startDate >= existingStart && startDate < existingEnd) ||
        (endDate > existingStart && endDate <= existingEnd) ||
        (startDate <= existingStart && endDate >= existingEnd)
      ) {
        throw new Error('车辆在此时间段已被预订');
      }
    }

    // 5. 计算价格
    const dailyPrice = Number(vehicle.vehicleModel?.dailyPrice || 599);
    const rentalPrice = dailyPrice * rentalDays;
    const insurancePrice = dto.needInsurance ? 100 * rentalDays : 0;

    let additionalServicePrice = 0;
    if (dto.additionalServices && dto.additionalServices.length > 0) {
      additionalServicePrice = dto.additionalServices.reduce(
        (sum, service) => sum + Number(service.price),
        0
      );
    }

    const totalPrice = rentalPrice + insurancePrice + additionalServicePrice;

    // 根据车型模板获取押金配置
    const vehicleDeposit = vehicle.vehicleModel?.vehicleDeposit || Math.floor(dailyPrice * 1.5);
    const violationDeposit = vehicle.vehicleModel?.violationDeposit || Math.floor(dailyPrice * 1.5);
    const totalDeposit = vehicleDeposit + violationDeposit;

    // 6. 生成订单号（确保唯一）
    let orderNo = generateOrderNumber();
    let attempts = 0;
    while (await this.orderRepository.findOne({ where: { orderNo } })) {
      orderNo = generateOrderNumber();
      attempts++;
      if (attempts > 10) {
        throw new Error('订单号生成失败，请重试');
      }
    }

    // 7. 创建订单
    const order = this.orderRepository.create({
      orderNo,
      userId,
      vehicleId: dto.vehicleId,
      orderType: OrderType.RV_RENTAL,
      startDate,
      endDate,
      rentalDays,
      pickupStoreId: dto.pickupStoreId || vehicle.storeId,
      returnStoreId: dto.returnStoreId || dto.pickupStoreId || vehicle.storeId,
      rentalPrice,
      insurancePrice,
      additionalServices: dto.additionalServices,
      totalPrice,
      vehicleDeposit,
      violationDeposit,
      totalDeposit,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    });

    await this.orderRepository.save(order);

    logger.info(`订单创建成功: ${order.orderNo} - 用户: ${userId}`);

    // 返回订单（包含关联信息）
    return this.orderRepository.findOne({
      where: { id: order.id },
      relations: ['user', 'vehicle', 'vehicle.vehicleModel'],
    }) as Promise<Order>;
  }

  /**
   * 获取我的订单列表（用户端）
   */
  async getMyOrders(
    userId: string,
    dto: OrderQueryDTO
  ): Promise<{ orders: Order[]; total: number }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };

    if (dto.status) {
      where.status = dto.status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['vehicle', 'vehicle.vehicleModel'],
      order: { created_at: 'DESC' },
      skip,
      take: pageSize,
    });

    return { orders, total };
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'vehicle', 'vehicle.vehicleModel'],
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 如果指定了userId，检查权限
    if (userId && order.userId !== userId) {
      throw new Error('无权访问此订单');
    }

    return order;
  }

  /**
   * 获取订单列表（管理端）
   */
  async getAdminOrders(dto: OrderQueryDTO): Promise<{ orders: Order[]; total: number }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.orderType) {
      where.orderType = dto.orderType;
    }

    if (dto.startDate && dto.endDate) {
      where.created_at = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    if (dto.storeId) {
      where.pickupStoreId = dto.storeId;
    }

    if (dto.keyword) {
      // 搜索订单号
      where.orderNo = Like(`%${dto.keyword}%`);
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['user', 'vehicle', 'vehicle.vehicleModel'],
      order: { created_at: 'DESC' },
      skip,
      take: pageSize,
    });

    return { orders, total };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, remarks?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证状态转换合法性
    this.validateStatusTransition(order.status, status);

    order.status = status;
    if (remarks) {
      order.remarks = remarks;
    }

    // 更新相关时间戳
    if (status === OrderStatus.PAID) {
      order.paidAt = new Date();
      order.paymentStatus = PaymentStatus.PAID;
    } else if (status === OrderStatus.PICKUP) {
      order.pickupTime = new Date();
    } else if (status === OrderStatus.RETURN) {
      order.returnTime = new Date();
    } else if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    await this.orderRepository.save(order);

    logger.info(`订单状态更新: ${order.orderNo} ${order.status} -> ${status}`);

    return order;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDTO): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.userId !== userId) {
      throw new Error('无权取消此订单');
    }

    // 只能取消待支付或已支付的订单
    if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status)) {
      throw new Error('当前订单状态不可取消');
    }

    // 如果已支付，检查取消政策并计算退款
    if (order.status === OrderStatus.PAID) {
      const now = new Date();
      const startDate = new Date(order.startDate);
      const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilStart < 0) {
        throw new Error('车辆已开始使用，不可取消');
      }

      // 计算退款金额
      if (hoursUntilStart >= 24) {
        // 24小时以上，全额退款
        order.refundAmount = Number(order.totalPrice);
      } else {
        // 24小时内，扣除10%手续费
        order.refundAmount = Number(order.totalPrice) * 0.9;
      }

      order.paymentStatus = PaymentStatus.REFUNDING;

      // 创建退款申请
      try {
        const refundReason = dto.reason || '用户取消订单';
        await this.refundService.createRefund(orderId, refundReason);
        logger.info(`退款申请已创建: 订单=${order.orderNo}, 金额=${order.refundAmount}`);
      } catch (error: any) {
        logger.error(`创建退款申请失败: ${error.message}`);
        // 退款申请失败不影响订单取消，但记录错误
      }
    }

    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = dto.reason;
    order.cancelledAt = new Date();

    await this.orderRepository.save(order);

    logger.info(`订单取消: ${order.orderNo} - 用户: ${userId}`);

    return order;
  }

  /**
   * 处理退款
   */
  async processRefund(orderId: string, refundAmount: number, reason?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.CANCELLED) {
      throw new Error('只能为已取消订单退款');
    }

    if (
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.REFUNDING
    ) {
      throw new Error('订单未支付或已退款');
    }

    if (refundAmount > Number(order.totalPrice)) {
      throw new Error('退款金额不能超过订单总额');
    }

    order.refundAmount = refundAmount;
    order.paymentStatus = PaymentStatus.REFUNDED;
    order.status = OrderStatus.REFUNDED;
    if (reason) {
      order.remarks = (order.remarks || '') + `\n退款原因: ${reason}`;
    }

    await this.orderRepository.save(order);

    logger.info(`订单退款: ${order.orderNo} - 金额: ${refundAmount}`);

    return order;
  }

  /**
   * 验证状态转换合法性
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.PICKUP]: [OrderStatus.USING, OrderStatus.CANCELLED],
      [OrderStatus.USING]: [OrderStatus.RETURN, OrderStatus.CANCELLED],
      [OrderStatus.RETURN]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [], // 已完成不能再转换
      [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [], // 已退款不能再转换
    };

    const allowedStatuses = validTransitions[currentStatus];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`不允许从 ${currentStatus} 转换到 ${newStatus}`);
    }
  }

  // ============ 押金管理相关方法 ============

  /**
   * 处理车辆押金支付
   */
  async processVehicleDepositPayment(orderId: string, paymentDetails: {
    paymentMethod: 'wechat' | 'alipay' | 'cash';
    transactionId?: string;
    amount: number;
  }): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['vehicle', 'vehicle.vehicleModel']
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.vehicleDepositStatus === 'paid') {
      throw new Error('车辆押金已支付');
    }

    if (paymentDetails.amount !== order.vehicleDeposit) {
      throw new Error('支付金额与押金金额不符');
    }

    // 更新押金支付状态
    order.vehicleDepositStatus = 'paid';
    order.vehicleDepositPaidAt = new Date();

    await this.orderRepository.save(order);

    logger.info(`车辆押金支付成功: 订单${order.orderNo}, 金额¥${paymentDetails.amount}`);
    return order;
  }

  /**
   * 处理违章押金支付
   */
  async processViolationDepositPayment(orderId: string, paymentDetails: {
    paymentMethod: 'wechat' | 'alipay' | 'cash';
    transactionId?: string;
    amount: number;
  }): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['vehicle', 'vehicle.vehicleModel']
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.violationDepositStatus === 'paid') {
      throw new Error('违章押金已支付');
    }

    if (paymentDetails.amount !== order.violationDeposit) {
      throw new Error('支付金额与押金金额不符');
    }

    // 更新押金支付状态
    order.violationDepositStatus = 'paid';
    order.violationDepositPaidAt = new Date();

    await this.orderRepository.save(order);

    logger.info(`违章押金支付成功: 订单${order.orderNo}, 金额¥${paymentDetails.amount}`);
    return order;
  }

  /**
   * 处理车辆押金退还
   */
  async processVehicleDepositRefund(orderId: string, deductionAmount?: number, reason?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.vehicleDepositStatus !== 'paid') {
      throw new Error('车辆押金未支付，无法退还');
    }

    // 计算实际退还金额
    const refundAmount = order.vehicleDeposit - (deductionAmount || 0);

    if (deductionAmount && deductionAmount > 0) {
      order.vehicleDepositDeduction = deductionAmount;
      order.depositDeductionReason = reason;
      order.vehicleDepositStatus = 'deducted';
    } else {
      order.vehicleDepositStatus = 'refunded';
    }

    order.vehicleDepositRefundedAt = new Date();

    await this.orderRepository.save(order);

    // TODO: 这里应该调用退款服务的实际退款逻辑
    // await this.refundService.processRefund({
    //   orderId: order.id,
    //   amount: refundAmount,
    //   type: 'vehicle_deposit',
    //   reason: reason || '车辆押金退还'
    // });

    logger.info(`车辆押金退还处理: 订单${order.orderNo}, 退还金额¥${refundAmount}`);
    return order;
  }

  /**
   * 处理违章押金退还
   */
  async processViolationDepositRefund(orderId: string, deductionAmount?: number, reason?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.violationDepositStatus !== 'paid') {
      throw new Error('违章押金未支付，无法退还');
    }

    // 设置预计退还时间（30天后）
    const expectedRefundDate = new Date();
    expectedRefundDate.setDate(expectedRefundDate.getDate() + 30);

    // 计算实际退还金额
    const refundAmount = order.violationDeposit - (deductionAmount || 0);

    if (deductionAmount && deductionAmount > 0) {
      order.violationDepositDeduction = deductionAmount;
      order.depositDeductionReason = reason;
      order.violationDepositStatus = 'deducted';
    } else {
      order.violationDepositStatus = 'refunded';
      order.violationDepositRefundedAt = new Date();
    }

    order.violationDepositExpectedRefundAt = expectedRefundDate;

    await this.orderRepository.save(order);

    // 如果没有扣除，设置自动退还任务
    if (!deductionAmount) {
      // TODO: 这里应该设置定时任务在30天后自动退款
      // await this.scheduleAutoRefund(order.id, 'violation_deposit', expectedRefundDate);
    }

    logger.info(`违章押金退还处理: 订单${order.orderNo}, 退还金额¥${refundAmount}, 预计退还时间${expectedRefundDate.toISOString()}`);
    return order;
  }

  /**
   * 获取订单押金信息
   */
  async getOrderDepositInfo(orderId: string): Promise<{
    vehicleDeposit: number;
    violationDeposit: number;
    totalDeposit: number;
    vehicleDepositStatus: string;
    violationDepositStatus: string;
    vehicleDepositPaidAt?: Date;
    violationDepositPaidAt?: Date;
    vehicleDepositRefundedAt?: Date;
    violationDepositRefundedAt?: Date;
    violationDepositExpectedRefundAt?: Date;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: [
        'vehicleDeposit', 'violationDeposit', 'totalDeposit',
        'vehicleDepositStatus', 'violationDepositStatus',
        'vehicleDepositPaidAt', 'violationDepositPaidAt',
        'vehicleDepositRefundedAt', 'violationDepositRefundedAt',
        'violationDepositExpectedRefundAt'
      ]
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return {
      vehicleDeposit: order.vehicleDeposit,
      violationDeposit: order.violationDeposit,
      totalDeposit: order.totalDeposit,
      vehicleDepositStatus: order.vehicleDepositStatus,
      violationDepositStatus: order.violationDepositStatus,
      vehicleDepositPaidAt: order.vehicleDepositPaidAt,
      violationDepositPaidAt: order.violationDepositPaidAt,
      vehicleDepositRefundedAt: order.vehicleDepositRefundedAt,
      violationDepositRefundedAt: order.violationDepositRefundedAt,
      violationDepositExpectedRefundAt: order.violationDepositExpectedRefundAt
    };
  }

  /**
   * 批量处理违章押金自动退还
   */
  async processViolationDepositAutoRefunds(): Promise<{ processed: number; failed: number }> {
      const orders = await this.orderRepository.createQueryBuilder('order')
      .where('order.violationDepositStatus = :status', { status: 'paid' })
      .andWhere('order.violationDepositRefundedAt IS NULL')
      .andWhere('order.violationDepositExpectedRefundAt IS NULL')
      .getMany();

    let processed = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        // 检查是否超过30天
        const completionDate = order.completedAt || order.returnTime;
        if (completionDate) {
          const thirtyDaysLater = new Date(completionDate);
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

          if (new Date() >= thirtyDaysLater) {
            await this.processViolationDepositRefund(order.id);
            processed++;
          }
        }
      } catch (error) {
        logger.error(`自动退还违章押金失败: 订单${order.orderNo}`, error);
        failed++;
      }
    }

    logger.info(`违章押金自动退还处理完成: 成功${processed}个, 失败${failed}个`);
    return { processed, failed };
  }
}
