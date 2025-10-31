<template>
  <view class="deposit-payment-page">
    <!-- 头部导航 -->
    <view class="header">
      <view class="nav-bar">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="title">押金支付</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 支付内容 -->
    <view v-else-if="orderInfo" class="payment-content">
      <!-- 订单信息 -->
      <view class="order-info-section">
        <view class="section-title">订单信息</view>
        <view class="order-card">
          <view class="order-header">
            <text class="order-number">订单号：{{ orderInfo.orderNo }}</text>
            <text class="order-status" :class="getStatusClass(orderInfo.status)">
              {{ getStatusText(orderInfo.status) }}
            </text>
          </view>
          <view class="vehicle-info">
            <image :src="orderInfo.vehicleImage" class="vehicle-image" />
            <view class="vehicle-details">
              <text class="vehicle-name">{{ orderInfo.vehicleName }}</text>
              <text class="rental-period">{{ orderInfo.rentalPeriod }}</text>
              <text class="pickup-location">取车点：{{ orderInfo.pickupLocation }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 押金明细 -->
      <view class="deposit-section">
        <view class="section-title">押金明细</view>
        <view class="deposit-card">
          <view class="deposit-item">
            <view class="deposit-left">
              <text class="deposit-name">车辆押金</text>
              <text class="deposit-desc">还车时立即退还</text>
            </view>
            <view class="deposit-right">
              <text class="deposit-amount">¥{{ orderInfo.vehicleDeposit }}</text>
              <view class="deposit-status" :class="getDepositStatusClass(orderInfo.vehicleDepositStatus)">
                {{ getDepositStatusText(orderInfo.vehicleDepositStatus) }}
              </view>
            </view>
          </view>

          <view class="deposit-item">
            <view class="deposit-left">
              <text class="deposit-name">违章押金</text>
              <text class="deposit-desc">还车30天后无违章自动退还</text>
            </view>
            <view class="deposit-right">
              <text class="deposit-amount">¥{{ orderInfo.violationDeposit }}</text>
              <view class="deposit-status" :class="getDepositStatusClass(orderInfo.violationDepositStatus)">
                {{ getDepositStatusText(orderInfo.violationDepositStatus) }}
              </view>
            </view>
          </view>

          <view class="deposit-total">
            <text class="total-label">押金总额</text>
            <text class="total-amount">¥{{ orderInfo.totalDeposit }}</text>
          </view>
        </view>
      </view>

      <!-- 支付方式选择 -->
      <view v-if="hasUnpaidDeposits" class="payment-method-section">
        <view class="section-title">选择支付方式</view>
        <view class="payment-methods">
          <view
            v-for="method in paymentMethods"
            :key="method.id"
            class="payment-method"
            :class="{ active: selectedMethod === method.id }"
            @click="selectPaymentMethod(method.id)"
          >
            <view class="method-info">
              <image :src="method.icon" class="method-icon" />
              <text class="method-name">{{ method.name }}</text>
            </view>
            <view class="method-radio">
              <view v-if="selectedMethod === method.id" class="radio-checked"></view>
              <view v-else class="radio-unchecked"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 线下支付说明 -->
      <view v-if="selectedMethod === 'offline'" class="offline-payment-section">
        <view class="section-title">线下支付说明</view>
        <view class="offline-payment-card">
          <view class="qr-code-container" v-if="qrCodeUrl">
            <image :src="qrCodeUrl" class="qr-code" @click="previewQRCode" />
            <text class="qr-tip">点击放大二维码</text>
          </view>
          <view class="payment-steps">
            <text class="step-title">支付步骤：</text>
            <text class="step-item">1. 选择支付方式（微信/支付宝/现金）</text>
            <text class="step-item">2. 扫描上方二维码或到店支付</text>
            <text class="step-item">3. 支付完成后系统将自动确认</text>
          </view>
          <view class="payment-info">
            <view class="info-item">
              <text class="info-label">收款方：</text>
              <text class="info-value">岛岛房车租赁</text>
            </view>
            <view class="info-item">
              <text class="info-label">支付金额：</text>
              <text class="info-value amount">¥{{ getUnpaidDepositAmount() }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-text">加载失败，请重试</text>
      <button class="retry-button" @click="loadOrderInfo">重新加载</button>
    </view>

    <!-- 底部支付按钮 -->
    <view v-if="orderInfo && hasUnpaidDeposits" class="bottom-bar">
      <view class="payment-info">
        <text class="pay-label">需支付</text>
        <text class="pay-amount">¥{{ getUnpaidDepositAmount() }}</text>
      </view>
      <button
        class="pay-button"
        :class="{ disabled: !selectedMethod || processing }"
        :disabled="!selectedMethod || processing"
        @click="handlePayment"
      >
        {{ processing ? '处理中...' : '确认支付' }}
      </button>
    </view>

    <!-- 已完成支付底部 -->
    <view v-else-if="orderInfo && !hasUnpaidDeposits" class="bottom-bar completed">
      <button class="view-order-button" @click="viewOrderDetail">查看订单详情</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import {
  getOrderDepositInfo,
  generateDepositPaymentQR,
  processVehicleDepositPayment,
  processViolationDepositPayment,
} from "@/api/modules/deposit";

// 页面参数
const orderId = ref<string>("");

// 页面状态
const loading = ref(true);
const processing = ref(false);
const orderInfo = ref<any>(null);
const selectedMethod = ref<string>("offline");
const qrCodeUrl = ref<string>("");
const paymentTimer = ref<any>(null);

// 支付方式列表
const paymentMethods = ref([
  {
    id: "wechat",
    name: "微信支付",
    icon: "/static/icons/wechat-pay.png",
  },
  {
    id: "alipay",
    name: "支付宝",
    icon: "/static/icons/alipay.png",
  },
  {
    id: "offline",
    name: "线下支付",
    icon: "/static/icons/qr-code.png",
  },
]);

// 计算属性
const hasUnpaidDeposits = computed(() => {
  if (!orderInfo.value) return false;
  return (
    orderInfo.value.vehicleDepositStatus === "unpaid" ||
    orderInfo.value.violationDepositStatus === "unpaid"
  );
});

/**
 * 页面加载
 */
onLoad((options: any) => {
  console.log("押金支付页参数:", options);
  orderId.value = options.orderId || "";

  if (!orderId.value) {
    uni.showToast({
      title: "参数错误",
      icon: "none",
    });
    return;
  }

  loadOrderInfo();
});

/**
 * 页面卸载
 */
onUnmounted(() => {
  if (paymentTimer.value) {
    clearInterval(paymentTimer.value);
  }
});

/**
 * 加载订单信息
 */
const loadOrderInfo = async () => {
  try {
    loading.value = true;

    const res = await getOrderDepositInfo(orderId.value);

    if (res.success) {
      orderInfo.value = res.data;

      // 如果选择线下支付，生成二维码
      if (selectedMethod.value === "offline") {
        generateQRCode();
      }
    } else {
      throw new Error(res.message || "获取订单信息失败");
    }
  } catch (error: any) {
    console.error("加载订单信息失败:", error);
    uni.showToast({
      title: error.message || "加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 生成支付二维码
 */
const generateQRCode = async () => {
  try {
    const res = await generateDepositPaymentQR(orderId.value);

    if (res.success) {
      qrCodeUrl.value = res.data.qrCodeUrl;
    }
  } catch (error) {
    console.error("生成二维码失败:", error);
  }
};

/**
 * 选择支付方式
 */
const selectPaymentMethod = (methodId: string) => {
  selectedMethod.value = methodId;

  if (methodId === "offline") {
    generateQRCode();
  } else {
    qrCodeUrl.value = "";
  }
};

/**
 * 处理支付
 */
const handlePayment = async () => {
  if (!selectedMethod.value || processing.value) return;

  try {
    processing.value = true;

    // 根据支付方式调用不同接口
    if (selectedMethod.value === "wechat") {
      await processWechatPayment();
    } else if (selectedMethod.value === "alipay") {
      await processAlipayPayment();
    } else if (selectedMethod.value === "offline") {
      await processOfflinePayment();
    }
  } catch (error: any) {
    console.error("支付处理失败:", error);
    uni.showToast({
      title: error.message || "支付失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
};

/**
 * 处理微信支付
 */
const processWechatPayment = async () => {
  const unpaidDeposits = getUnpaidDeposits();

  for (const depositType of unpaidDeposits) {
    try {
      const res = depositType === "vehicle-deposit"
        ? await processVehicleDepositPayment(orderId.value, {
            paymentMethod: "wechat",
            amount: orderInfo.value.vehicleDeposit,
          })
        : await processViolationDepositPayment(orderId.value, {
            paymentMethod: "wechat",
            amount: orderInfo.value.violationDeposit,
          });

      if (!res.success) {
        throw new Error(res.message || "支付请求失败");
      }

      // TODO: 调起微信支付
      uni.showToast({
        title: "微信支付功能开发中",
        icon: "none",
      });
      break;
    } catch (error: any) {
      throw new Error(error.message || "支付失败");
    }
  }
};

/**
 * 处理支付宝支付
 */
const processAlipayPayment = async () => {
  const unpaidDeposits = getUnpaidDeposits();

  for (const depositType of unpaidDeposits) {
    try {
      const res = depositType === "vehicle-deposit"
        ? await processVehicleDepositPayment(orderId.value, {
            paymentMethod: "alipay",
            amount: orderInfo.value.vehicleDeposit,
          })
        : await processViolationDepositPayment(orderId.value, {
            paymentMethod: "alipay",
            amount: orderInfo.value.violationDeposit,
          });

      if (!res.success) {
        throw new Error(res.message || "支付请求失败");
      }

      // TODO: 调起支付宝支付
      uni.showToast({
        title: "支付宝支付功能开发中",
        icon: "none",
      });
      break;
    } catch (error: any) {
      throw new Error(error.message || "支付失败");
    }
  }
};

/**
 * 处理线下支付
 */
const processOfflinePayment = async () => {
  uni.showToast({
    title: "请到店扫码支付",
    icon: "none",
    duration: 2000,
  });

  // 开始轮询支付状态
  startPaymentPolling();
};

/**
 * 开始支付状态轮询
 */
const startPaymentPolling = () => {
  if (paymentTimer.value) {
    clearInterval(paymentTimer.value);
  }

  paymentTimer.value = setInterval(async () => {
    try {
      await loadOrderInfo();

      // 检查是否所有押金都已支付
      if (
        orderInfo.value.vehicleDepositStatus === "paid" &&
        orderInfo.value.violationDepositStatus === "paid"
      ) {
        clearInterval(paymentTimer.value);

        uni.showToast({
          title: "支付成功",
          icon: "success",
        });

        // 跳转到支付成功页面
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/deposit-payment-success/index?orderId=${orderId.value}`,
          });
        }, 1500);
      }
    } catch (error) {
      console.error("轮询支付状态失败:", error);
    }
  }, 3000); // 每3秒查询一次
};

/**
 * 获取未支付的押金类型
 */
const getUnpaidDeposits = (): string[] => {
  if (!orderInfo.value) return [];

  const unpaid = [];
  if (orderInfo.value.vehicleDepositStatus === "unpaid") {
    unpaid.push("vehicle-deposit");
  }
  if (orderInfo.value.violationDepositStatus === "unpaid") {
    unpaid.push("violation-deposit");
  }

  return unpaid;
};

/**
 * 获取未支付押金总额
 */
const getUnpaidDepositAmount = (): number => {
  if (!orderInfo.value) return 0;

  let amount = 0;
  if (orderInfo.value.vehicleDepositStatus === "unpaid") {
    amount += orderInfo.value.vehicleDeposit;
  }
  if (orderInfo.value.violationDepositStatus === "unpaid") {
    amount += orderInfo.value.violationDeposit;
  }

  return amount;
};

/**
 * 预览二维码
 */
const previewQRCode = () => {
  if (qrCodeUrl.value) {
    uni.previewImage({
      urls: [qrCodeUrl.value],
      current: 0,
    });
  }
};

/**
 * 返回上一页
 */
const goBack = () => {
  uni.navigateBack();
};

/**
 * 查看订单详情
 */
const viewOrderDetail = () => {
  uni.redirectTo({
    url: `/pages/order-detail/index?id=${orderId.value}`,
  });
};

/**
 * 获取订单状态样式类
 */
const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "status-pending",
    paid: "status-paid",
    confirmed: "status-confirmed",
    completed: "status-completed",
    cancelled: "status-cancelled",
  };
  return statusMap[status] || "status-pending";
};

/**
 * 获取订单状态文本
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "待支付",
    paid: "已支付",
    confirmed: "已确认",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || "未知状态";
};

/**
 * 获取押金状态样式类
 */
const getDepositStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    unpaid: "status-unpaid",
    paid: "status-paid",
    refunded: "status-refunded",
  };
  return statusMap[status] || "status-unpaid";
};

/**
 * 获取押金状态文本
 */
const getDepositStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    unpaid: "未支付",
    paid: "已支付",
    refunded: "已退还",
  };
  return statusMap[status] || "未知状态";
};
</script>

<style lang="scss" scoped>
.deposit-payment-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 140rpx; /* 底部操作栏高度 */
}

/* 头部导航 */
.header {
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  background-color: #fff;
}

.back-btn {
  font-size: 36rpx;
  color: #333;
  font-weight: 600;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 36rpx;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid rgba(255, 159, 41, 0.2);
  border-top-color: #ff9f29;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 32rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999;
}

.retry-button {
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 28rpx;
}

/* 支付内容 */
.payment-content {
  padding: 16rpx 0;
}

/* 通用区块样式 */
.order-info-section,
.deposit-section,
.payment-method-section,
.offline-payment-section {
  margin-bottom: 16rpx;
}

.section-title {
  padding: 24rpx 32rpx 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

/* 订单信息卡片 */
.order-card {
  background-color: #fff;
  padding: 32rpx;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-number {
  font-size: 28rpx;
  color: #666;
}

.order-status {
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3e0;
  color: #ff9800;
}

.status-paid {
  background-color: #e8f5e8;
  color: #4caf50;
}

.status-confirmed {
  background-color: #e3f2fd;
  color: #2196f3;
}

.vehicle-info {
  display: flex;
  gap: 24rpx;
}

.vehicle-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
}

.vehicle-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.vehicle-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.rental-period {
  font-size: 26rpx;
  color: #666;
}

.pickup-location {
  font-size: 24rpx;
  color: #999;
}

/* 押金卡片 */
.deposit-card {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.deposit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.deposit-item:last-child {
  border-bottom: none;
}

.deposit-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.deposit-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.deposit-desc {
  font-size: 24rpx;
  color: #999;
}

.deposit-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.deposit-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b35;
}

.deposit-status {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-unpaid {
  background-color: #ffebee;
  color: #f44336;
}

.status-paid {
  background-color: #e8f5e8;
  color: #4caf50;
}

.status-refunded {
  background-color: #e3f2fd;
  color: #2196f3;
}

.deposit-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background-color: #fff8f5;
  border-top: 2rpx solid #ff6b35;
}

.total-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.total-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff6b35;
}

/* 支付方式 */
.payment-methods {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.payment-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s;
}

.payment-method:last-child {
  border-bottom: none;
}

.payment-method.active {
  background-color: #fff8f5;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.method-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
}

.method-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.method-radio {
  width: 32rpx;
  height: 32rpx;
}

.radio-checked {
  width: 32rpx;
  height: 32rpx;
  background-color: #ff6b35;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.radio-checked::after {
  content: "";
  width: 12rpx;
  height: 12rpx;
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
}

.radio-unchecked {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
}

/* 线下支付 */
.offline-payment-card {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  padding: 32rpx;
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.qr-code {
  width: 300rpx;
  height: 300rpx;
  border-radius: 12rpx;
  border: 2rpx solid #eee;
}

.qr-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}

.payment-steps {
  margin-bottom: 32rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.step-item {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  padding-left: 20rpx;
  position: relative;
}

.step-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12rpx;
  width: 8rpx;
  height: 8rpx;
  background-color: #ff6b35;
  border-radius: 50%;
}

.payment-info {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 24rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.info-value.amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b35;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.bottom-bar.completed {
  justify-content: center;
}

.payment-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.pay-label {
  font-size: 26rpx;
  color: #666;
}

.pay-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff6b35;
}

.pay-button {
  width: 240rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
  transition: opacity 0.2s;
}

.pay-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-order-button {
  width: 400rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
}
</style>