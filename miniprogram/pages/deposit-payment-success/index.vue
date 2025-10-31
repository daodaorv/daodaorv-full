<template>
  <view class="success-page">
    <!-- 成功状态展示 -->
    <view class="success-container">
      <!-- 成功图标动画 -->
      <view class="success-icon-container">
        <view class="success-circle">
          <view class="success-checkmark">✓</view>
        </view>
        <view class="success-particles">
          <view v-for="i in 8" :key="i" class="particle" :style="getParticleStyle(i)"></view>
        </view>
      </view>

      <!-- 成功文本 -->
      <text class="success-title">押金支付成功</text>
      <text class="success-subtitle">您已成功完成押金支付</text>

      <!-- 支付详情 -->
      <view v-if="orderInfo" class="payment-details">
        <view class="detail-item">
          <text class="detail-label">订单号</text>
          <text class="detail-value">{{ orderInfo.orderNo }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">支付金额</text>
          <text class="detail-value amount">¥{{ paidAmount }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">支付时间</text>
          <text class="detail-value">{{ paymentTime }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">支付方式</text>
          <text class="detail-value">{{ getPaymentMethodText(paymentMethod) }}</text>
        </view>
      </view>

      <!-- 押金状态 -->
      <view v-if="orderInfo" class="deposit-status-summary">
        <view class="status-item">
          <view class="status-left">
            <text class="status-name">车辆押金</text>
            <text class="status-desc">还车时立即退还</text>
          </view>
          <view class="status-right">
            <text class="status-amount">¥{{ orderInfo.vehicleDeposit }}</text>
            <view class="status-badge paid">已支付</view>
          </view>
        </view>
        <view class="status-item">
          <view class="status-left">
            <text class="status-name">违章押金</text>
            <text class="status-desc">还车30天后自动退还</text>
          </view>
          <view class="status-right">
            <text class="status-amount">¥{{ orderInfo.violationDeposit }}</text>
            <view class="status-badge paid">已支付</view>
          </view>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tips-section">
        <view class="tips-title">
          <text class="tips-icon">💡</text>
          <text class="tips-text">温馨提示</text>
        </view>
        <view class="tips-content">
          <text class="tip-item">• 车辆押金将在还车时检查完毕后立即退还</text>
          <text class="tip-item">• 违章押金将在还车30天后无违章记录时自动退还</text>
          <text class="tip-item">• 退还金额将原路返回到您的支付账户</text>
          <text class="tip-item">• 如有疑问，请联系客服：400-888-8888</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <button class="action-btn secondary" @click="viewOrder">查看订单</button>
      <button class="action-btn primary" @click="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";

// 页面参数
const orderId = ref<string>("");
const paymentMethod = ref<string>("");
const paidAmount = ref<number>(0);

// 页面状态
const orderInfo = ref<any>(null);
const paymentTime = ref<string>("");

/**
 * 页面加载
 */
onLoad((options: any) => {
  console.log("押金支付成功页参数:", options);
  orderId.value = options.orderId || "";
  paymentMethod.value = options.paymentMethod || "offline";
  paidAmount.value = parseFloat(options.amount) || 0;

  if (!orderId.value) {
    uni.showToast({
      title: "参数错误",
      icon: "none",
    });
    setTimeout(() => {
      uni.reLaunch({
        url: "/pages/index/index",
      });
    }, 1500);
    return;
  }

  // 设置支付时间
  paymentTime.value = formatTime(new Date());

  // 加载订单信息
  loadOrderInfo();
});

/**
 * 加载订单信息
 */
const loadOrderInfo = async () => {
  try {
    const res = await uni.request({
      url: `http://localhost:3000/api/deposits/orders/${orderId.value}/deposit-info`,
      method: "GET",
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${uni.getStorageSync("token")}`,
      },
    });

    if (res.statusCode === 200 && res.data.success) {
      orderInfo.value = res.data.data;
    }
  } catch (error) {
    console.error("加载订单信息失败:", error);
  }
};

/**
 * 获取粒子动画样式
 */
const getParticleStyle = (index: number) => {
  const angle = (index * 45) * Math.PI / 180;
  const distance = 80;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return {
    transform: `translate(${x}rpx, ${y}rpx)`,
    animationDelay: `${index * 0.1}s`
  };
};

/**
 * 获取支付方式文本
 */
const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    wechat: "微信支付",
    alipay: "支付宝",
    offline: "线下支付",
  };
  return methodMap[method] || "未知方式";
};

/**
 * 格式化时间
 */
const formatTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 查看订单详情
 */
const viewOrder = () => {
  uni.redirectTo({
    url: `/pages/order-detail/index?id=${orderId.value}`,
  });
};

/**
 * 返回首页
 */
const goHome = () => {
  uni.reLaunch({
    url: "/pages/index/index",
  });
};
</script>

<style lang="scss" scoped>
.success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding-bottom: 140rpx; /* 底部按钮高度 */
}

/* 成功容器 */
.success-container {
  flex: 1;
  padding: 60rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 成功图标动画 */
.success-icon-container {
  position: relative;
  margin-bottom: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-circle {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(76, 175, 80, 0.3);
  animation: successBounce 0.6s ease-out;
}

@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-checkmark {
  font-size: 80rpx;
  color: #fff;
  font-weight: bold;
  animation: checkmarkDraw 0.6s ease-out 0.3s both;
}

@keyframes checkmarkDraw {
  0% {
    transform: scale(0) rotate(-45deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}

/* 粒子动画 */
.success-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat 2s ease-out infinite;
}

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  20% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--x, 0), var(--y, -100rpx)) scale(0.5);
  }
}

/* 成功文本 */
.success-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
  text-align: center;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.success-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 60rpx;
  animation: fadeInUp 0.6s ease-out 0.5s both;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 支付详情卡片 */
.payment-details {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.detail-value.amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b35;
}

/* 押金状态汇总 */
.deposit-status-summary {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out 0.7s both;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.status-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.status-desc {
  font-size: 24rpx;
  color: #999;
}

.status-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.status-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-badge.paid {
  background-color: #e8f5e8;
  color: #4caf50;
}

/* 温馨提示 */
.tips-section {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out 0.8s both;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tips-icon {
  font-size: 32rpx;
}

.tips-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tip-item {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.3);
  animation: slideUp 0.6s ease-out 0.9s both;
}

@keyframes slideUp {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.action-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #666;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.action-btn.primary {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
}

.action-btn:active {
  transform: scale(0.98);
}
</style>