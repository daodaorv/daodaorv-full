import { request } from "../request";

/**
 * 押金支付相关API
 */

export interface DepositInfo {
  orderId: string;
  orderNo: string;
  vehicleName: string;
  vehicleImage: string;
  rentalPeriod: string;
  pickupLocation: string;
  vehicleDeposit: number;
  violationDeposit: number;
  totalDeposit: number;
  vehicleDepositStatus: "unpaid" | "paid" | "refunded";
  violationDepositStatus: "unpaid" | "paid" | "refunded";
  status: string;
}

export interface PaymentResult {
  success: boolean;
  message?: string;
  data?: {
    paymentNo?: string;
    qrCodeUrl?: string;
    amount?: number;
  };
}

export interface DepositPaymentParams {
  paymentMethod: "wechat" | "alipay" | "cash";
  transactionId?: string;
  amount: number;
}

/**
 * 获取订单押金信息
 */
export function getOrderDepositInfo(orderId: string): Promise<{
  success: boolean;
  data: DepositInfo;
  message?: string;
}> {
  return request({
    url: `/api/deposits/orders/${orderId}/deposit-info`,
    method: "GET",
  });
}

/**
 * 生成押金支付二维码
 */
export function generateDepositPaymentQR(orderId: string): Promise<{
  success: boolean;
  data: {
    qrCodeUrl: string;
    expiresAt: string;
  };
  message?: string;
}> {
  return request({
    url: `/api/deposits/orders/${orderId}/deposit-qr`,
    method: "GET",
  });
}

/**
 * 处理车辆押金支付
 */
export function processVehicleDepositPayment(
  orderId: string,
  params: DepositPaymentParams
): Promise<PaymentResult> {
  return request({
    url: `/api/deposits/orders/${orderId}/vehicle-deposit/payment`,
    method: "POST",
    data: params,
  });
}

/**
 * 处理违章押金支��
 */
export function processViolationDepositPayment(
  orderId: string,
  params: DepositPaymentParams
): Promise<PaymentResult> {
  return request({
    url: `/api/deposits/orders/${orderId}/violation-deposit/payment`,
    method: "POST",
    data: params,
  });
}

/**
 * 申请车辆押金退还
 */
export function requestVehicleDepositRefund(orderId: string): Promise<{
  success: boolean;
  data: {
    refundId: string;
    amount: number;
    estimatedArrivalTime: string;
  };
  message?: string;
}> {
  return request({
    url: `/api/deposits/orders/${orderId}/vehicle-deposit/refund`,
    method: "POST",
  });
}

/**
 * 申请违章押金退还
 */
export function requestViolationDepositRefund(orderId: string): Promise<{
  success: boolean;
  data: {
    refundId: string;
    amount: number;
    estimatedArrivalTime: string;
  };
  message?: string;
}> {
  return request({
    url: `/api/deposits/orders/${orderId}/violation-deposit/refund`,
    method: "POST",
  });
}

/**
 * 批量处理违章押金自动退还（管理员接口）
 */
export function processViolationDepositAutoRefunds(): Promise<{
  success: boolean;
  data: {
    processed: number;
    failed: number;
    errors?: string[];
  };
  message?: string;
}> {
  return request({
    url: "/api/admin/deposits/violation-auto-refunds",
    method: "POST",
  });
}

/**
 * 获取用户押金支付记录
 */
export function getUserDepositPaymentHistory(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  success: boolean;
  data: {
    list: DepositInfo[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}> {
  return request({
    url: "/api/user/deposits/payment-history",
    method: "GET",
    data: params,
  });
}

/**
 * 获取用户押金退还记录
 */
export function getUserDepositRefundHistory(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  success: boolean;
  data: {
    list: Array<{
      id: string;
      orderId: string;
      orderNo: string;
      depositType: "vehicle" | "violation";
      amount: number;
      status: string;
      refundTime: string;
      arrivalTime: string;
    }>;
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}> {
  return request({
    url: "/api/user/deposits/refund-history",
    method: "GET",
    data: params,
  });
}