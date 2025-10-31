import { AppDataSource } from '../config/database';

import { Order, OrderStatus, PaymentStatus } from '../entities/Order';
import { PaymentRecord, PaymentStatus as PaymentRecordStatus } from '../entities/PaymentRecord';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';
import { logger } from '../utils/logger';

/**
 * 支付超时处理任务
 *
 * 功能：
 * 1. 查找超时未支付的订单（创建时间超过15分钟且状态为待支付）
 * 2. 取消超时订单
 * 3. 释放车辆库存
 * 4. 更新支付记录状态为失败
 */
export class PaymentTimeoutTask {
  private orderRepository = AppDataSource.getRepository(Order);
  private paymentRecordRepository = AppDataSource.getRepository(PaymentRecord);
  private vehicleRepository = AppDataSource.getRepository(Vehicle);

  /**
   * 执行超时订单处理
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始执行支付超时处理任务');

      // 1. 查找超时未支付的订单
      const timeoutOrders = await this.findTimeoutOrders();

      if (timeoutOrders.length === 0) {
        logger.info('没有超时订单需要处理');
        return;
      }

      logger.info(`发现 ${timeoutOrders.length} 个超时订单`);

      // 2. 处理每个超时订单
      for (const order of timeoutOrders) {
        await this.processTimeoutOrder(order);
      }

      logger.info('支付超时处理任务执行完成');
    } catch (error: any) {
      logger.error('支付超时处理任务执行失败:', error);
    }
  }

  /**
   * 查找超时未支付的订单
   * 超时时间：15分钟
   */
  private async findTimeoutOrders(): Promise<Order[]> {
    const timeoutMinutes = 15;
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.UNPAID })
      .andWhere('order.created_at < :timeoutDate', { timeoutDate })
      .getMany();

    return orders;
  }

  /**
   * 处理单个超时订单
   */
  private async processTimeoutOrder(order: Order): Promise<void> {
    try {
      logger.info(`处理超时订单: ${order.orderNo}`);

      // 1. 更新订单状态为已取消
      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = '支付超时自动取消';
      order.cancelledAt = new Date();
      await this.orderRepository.save(order);

      // 2. 释放车辆库存
      await this.releaseVehicle(order.vehicleId);

      // 3. 更新支付记录状态为失败（如果存在）
      await this.updatePaymentRecordStatus(order.id);

      logger.info(`超时订单处理完成: ${order.orderNo}`);
    } catch (error: any) {
      logger.error(`处理超时订单失败: ${order.orderNo}`, error);
    }
  }

  /**
   * 释放车辆库存
   */
  private async releaseVehicle(vehicleId: string): Promise<void> {
    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        logger.warn(`车辆不存在: ${vehicleId}`);
        return;
      }

      // 如果车辆状态是已租，恢复为可用
      // 注意：订单创建时可能已将车辆状态设置为已租，超时后需要恢复
      if (vehicle.status === VehicleStatus.RENTED) {
        vehicle.status = VehicleStatus.AVAILABLE;
        await this.vehicleRepository.save(vehicle);
        logger.info(`车辆库存已释放: ${vehicleId}`);
      }
    } catch (error: any) {
      logger.error(`释放车辆库存失败: ${vehicleId}`, error);
    }
  }

  /**
   * 更新支付记录状态为失败
   */
  private async updatePaymentRecordStatus(orderId: string): Promise<void> {
    try {
      const paymentRecords = await this.paymentRecordRepository.find({
        where: {
          orderId,
          status: PaymentRecordStatus.PENDING,
        },
      });

      if (paymentRecords.length === 0) {
        return;
      }

      for (const record of paymentRecords) {
        record.status = PaymentRecordStatus.FAILED;
        await this.paymentRecordRepository.save(record);
        logger.info(`支付记录状态已更新为失败: ${record.paymentNo}`);
      }
    } catch (error: any) {
      logger.error(`更新支付记录状态失败: 订单=${orderId}`, error);
    }
  }
}

/**
 * 启动定时任务
 * 每5分钟执行一次
 */
export function startPaymentTimeoutTask(): NodeJS.Timeout {
  const task = new PaymentTimeoutTask();
  const intervalMinutes = 5;

  logger.info(`支付超时处理任务已启动，执行间隔: ${intervalMinutes} 分钟`);

  // 立即执行一次
  task.execute();

  // 定时执行
  return setInterval(
    () => {
      task.execute();
    },
    intervalMinutes * 60 * 1000
  );
}
