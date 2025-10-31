<template>
  <view class="order-confirm-page">
    <!-- 头部导航 -->
    <view class="header">
      <view class="nav-bar">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="title">确认订单</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 订单内容 -->
    <view v-else-if="orderData" class="order-content">
      <!-- 车辆信息 -->
      <view class="vehicle-section">
        <view class="section-title">车辆信息</view>
        <view class="vehicle-card">
          <image :src="orderData.vehicleImage" class="vehicle-image" />
          <view class="vehicle-info">
            <text class="vehicle-name">{{ orderData.vehicleName }}</text>
            <text class="vehicle-category">{{ orderData.category }}</text>
            <view class="vehicle-features">
              <text class="feature-item">{{ orderData.seatCount }}座</text>
              <text class="feature-item">{{ orderData.bedCount }}床</text>
              <text class="feature-item">{{ orderData.transmission }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 租赁信息 -->
      <view class="rental-section">
        <view class="section-title">租赁信息</view>
        <view class="rental-card">
          <view class="rental-item">
            <text class="rental-label">取车时间</text>
            <text class="rental-value">{{ orderData.pickupTime }}</text>
          </view>
          <view class="rental-item">
            <text class="rental-label">还车时间</text>
            <text class="rental-value">{{ orderData.returnTime }}</text>
          </view>
          <view class="rental-item">
            <text class="rental-label">取车地点</text>
            <text class="rental-value">{{ orderData.pickupLocation }}</text>
          </view>
          <view class="rental-item">
            <text class="rental-label">还车地点</text>
            <text class="rental-value">{{ orderData.returnLocation }}</text>
          </view>
          <view class="rental-item">
            <text class="rental-label">租赁天数</text>
            <text class="rental-value">{{ orderData.rentalDays }}天</text>
          </view>
        </view>
      </view>

      <!-- 押金信息 -->
      <view class="deposit-section">
        <view class="section-title">
          <text>押金信息</text>
          <text class="deposit-tip">押金将在租赁结束后退还</text>
        </view>
        <view class="deposit-card">
          <view class="deposit-item">
            <view class="deposit-left">
              <text class="deposit-name">车辆押金</text>
              <text class="deposit-desc">还车时立即退还</text>
            </view>
            <text class="deposit-amount">¥{{ orderData.vehicleDeposit }}</text>
          </view>
          <view class="deposit-item">
            <view class="deposit-left">
              <text class="deposit-name">违章押金</text>
              <text class="deposit-desc">还车30天后无违章自动退还</text>
            </view>
            <text class="deposit-amount">¥{{ orderData.violationDeposit }}</text>
          </view>
          <view class="deposit-total">
            <text class="total-label">押金总额</text>
            <text class="total-amount">¥{{ orderData.totalDeposit }}</text>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="cost-section">
        <view class="section-title">费用明细</view>
        <view class="cost-card">
          <view class="cost-item">
            <text class="cost-label">车辆租金</text>
            <text class="cost-value">¥{{ orderData.rentalFee }}</text>
          </view>
          <view class="cost-item">
            <text class="cost-label">基础保险</text>
            <text class="cost-value">¥{{ orderData.insuranceFee }}</text>
          </view>
          <view class="cost-item">
            <text class="cost-label">服务费</text>
            <text class="cost-value">¥{{ orderData.serviceFee }}</text>
          </view>
          <view v-if="orderData.discountAmount > 0" class="cost-item discount">
            <text class="cost-label">优惠金额</text>
            <text class="cost-value">-¥{{ orderData.discountAmount }}</text>
          </view>
          <view class="cost-total">
            <text class="total-label">总计</text>
            <text class="total-amount">¥{{ orderData.totalAmount }}</text>
          </view>
        </view>
      </view>

      <!-- 用户信息 -->
      <view class="user-section">
        <view class="section-title">用户信息</view>
        <view class="user-card">
          <view class="user-item">
            <text class="user-label">姓名</text>
            <text class="user-value">{{ userInfo.name }}</text>
          </view>
          <view class="user-item">
            <text class="user-label">手机号</text>
            <text class="user-value">{{ userInfo.phone }}</text>
          </view>
          <view class="user-item">
            <text class="user-label">身份证号</text>
            <text class="user-value">{{ maskIdCard(userInfo.idCard) }}</text>
          </view>
        </view>
      </view>

      <!-- 租赁协议 -->
      <view class="agreement-section">
        <view class="agreement-item">
          <view
            class="checkbox"
            :class="{ checked: agreeToTerms }"
            @click="toggleAgreeTerms"
          >
            <text v-if="agreeToTerms" class="checkmark">✓</text>
          </view>
          <text class="agreement-text">
            我已阅读并同意
            <text class="agreement-link" @click="viewRentalAgreement">《租赁协议》</text>
            和
            <text class="agreement-link" @click="viewInsuranceTerms">《保险条款》</text>
          </text>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-text">加载失败，请重试</text>
      <button class="retry-button" @click="loadOrderData">重新加载</button>
    </view>

    <!-- 底部提交栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-label">需支付押金</text>
        <text class="price-amount">¥{{ getTotalDeposit() }}</text>
      </view>
      <button
        class="submit-button"
        :class="{ disabled: !agreeToTerms || submitting }"
        :disabled="!agreeToTerms || submitting"
        @click="submitOrder"
      >
        {{ submitting ? "提交中..." : "提交订单" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { createOrder } from "@/api/modules/booking";

// 页面参数
const biz = ref<"rv" | "special">("rv");
const vehicleId = ref<string>("");
const rentalData = ref<any>(null);

// 页面状态
const loading = ref(true);
const submitting = ref(false);
const orderData = ref<any>(null);
const agreeToTerms = ref(false);

// 用户信息
const userInfo = ref({
  name: "",
  phone: "",
  idCard: "",
});

/**
 * 页面加载
 */
onLoad((options: any) => {
  console.log("订单确认页参数:", options);
  biz.value = options.biz || "rv";
  vehicleId.value = options.id || "";

  // 解析租赁数据
  if (options.rentalData) {
    try {
      rentalData.value = JSON.parse(decodeURIComponent(options.rentalData));
    } catch (error) {
      console.error("解析租赁数据失败:", error);
    }
  }

  if (!vehicleId.value || !rentalData.value) {
    uni.showToast({
      title: "参数错误",
      icon: "none",
    });
    return;
  }

  loadUserInfo();
  loadOrderData();
});

/**
 * 加载用户信息
 */
const loadUserInfo = () => {
  // 从存储中获取用户信息
  const user = uni.getStorageSync("userInfo");
  if (user) {
    userInfo.value = {
      name: user.name || "",
      phone: user.phone || "",
      idCard: user.idCard || "",
    };
  }
};

/**
 * 加载订单数据
 */
const loadOrderData = () => {
  try {
    loading.value = true;

    // 根据业务类型和租赁数据构建订单信息
    const basePrice = biz.value === "special" ? 500 : 800; // 模拟基础价格
    const rentalDays = calculateRentalDays(
      rentalData.value.pickupDate,
      rentalData.value.returnDate
    );

    const vehicleDeposit = biz.value === "special" ? 2000 : 3000;
    const violationDeposit = biz.value === "special" ? 1000 : 2000;

    orderData.value = {
      vehicleName: biz.value === "special" ? "特惠房车套餐" : "豪华C型房车",
      vehicleImage: "https://picsum.photos/200/150?random=6",
      category: "C型房车",
      seatCount: 4,
      bedCount: 2,
      transmission: "自动挡",
      pickupTime: `${rentalData.value.pickupDate} ${rentalData.value.pickupTime}`,
      returnTime: `${rentalData.value.returnDate} ${rentalData.value.returnTime}`,
      pickupLocation: rentalData.value.pickupLocation || "待分配",
      returnLocation: rentalData.value.returnLocation || "待分配",
      rentalDays,
      vehicleDeposit,
      violationDeposit,
      totalDeposit: vehicleDeposit + violationDeposit,
      rentalFee: basePrice * rentalDays,
      insuranceFee: 100,
      serviceFee: 50,
      discountAmount: 0,
      totalAmount: basePrice * rentalDays + 100 + 50,
    };
  } catch (error) {
    console.error("加载订单数据失败:", error);
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 计算租赁天数
 */
const calculateRentalDays = (pickupDate: string, returnDate: string): number => {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  const diffTime = Math.abs(returnD.getTime() - pickup.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 获取总押金
 */
const getTotalDeposit = (): number => {
  if (!orderData.value) return 0;
  return orderData.value.vehicleDeposit + orderData.value.violationDeposit;
};

/**
 * 身份证号脱敏
 */
const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.substring(0, 6) + "********" + idCard.substring(idCard.length - 4);
};

/**
 * 切换协议同意状态
 */
const toggleAgreeTerms = () => {
  agreeToTerms.value = !agreeToTerms.value;
};

/**
 * 查看租赁协议
 */
const viewRentalAgreement = () => {
  uni.showToast({
    title: "协议查看功能开发中",
    icon: "none",
  });
};

/**
 * 查看保险条款
 */
const viewInsuranceTerms = () => {
  uni.showToast({
    title: "条款查看功能开发中",
    icon: "none",
  });
};

/**
 * 提交订单
 */
const submitOrder = async () => {
  if (!agreeToTerms.value || submitting.value) return;

  try {
    submitting.value = true;

    const orderParams = {
      vehicleId: vehicleId.value,
      bizType: biz.value,
      pickupDate: rentalData.value.pickupDate,
      pickupTime: rentalData.value.pickupTime,
      returnDate: rentalData.value.returnDate,
      returnTime: rentalData.value.returnTime,
      pickupLocation: rentalData.value.pickupLocation,
      returnLocation: rentalData.value.returnLocation,
      vehicleDeposit: orderData.value.vehicleDeposit,
      violationDeposit: orderData.value.violationDeposit,
      rentalFee: orderData.value.rentalFee,
      insuranceFee: orderData.value.insuranceFee,
      serviceFee: orderData.value.serviceFee,
      totalAmount: orderData.value.totalAmount,
    };

    const res = await createOrder(orderParams);

    if (res.success) {
      uni.showToast({
        title: "订单创建成功",
        icon: "success",
      });

      // 跳转到押金支付页面
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/deposit-payment/index?orderId=${res.data.orderId}`,
        });
      }, 1500);
    } else {
      throw new Error(res.message || "订单创建失败");
    }
  } catch (error: any) {
    console.error("提交订单失败:", error);
    uni.showToast({
      title: error.message || "提交失败",
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
};

/**
 * 返回上一页
 */
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.order-confirm-page {
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

/* 订单内容 */
.order-content {
  padding: 16rpx 0;
}

/* 通用区块样式 */
.vehicle-section,
.rental-section,
.deposit-section,
.cost-section,
.user-section {
  margin-bottom: 16rpx;
}

.section-title {
  padding: 24rpx 32rpx 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deposit-tip {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

/* 车辆信息卡片 */
.vehicle-card {
  background-color: #fff;
  padding: 32rpx;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 24rpx;
}

.vehicle-image {
  width: 160rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
}

.vehicle-info {
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

.vehicle-category {
  font-size: 26rpx;
  color: #666;
}

.vehicle-features {
  display: flex;
  gap: 16rpx;
}

.feature-item {
  font-size: 24rpx;
  color: #999;
  background-color: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

/* 租赁信息卡片 */
.rental-card {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.rental-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.rental-item:last-child {
  border-bottom: none;
}

.rental-label {
  font-size: 28rpx;
  color: #666;
}

.rental-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
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

.deposit-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b35;
}

.deposit-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background-color: #fff8f5;
  border-top: 2rpx solid #ff6b35;
}

/* 费用明细卡片 */
.cost-card {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.cost-item.discount {
  color: #4caf50;
}

.cost-item:last-child {
  border-bottom: none;
}

.cost-label {
  font-size: 28rpx;
  color: #666;
}

.cost-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.cost-item.discount .cost-value {
  color: #4caf50;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background-color: #f8f8f8;
  border-top: 1rpx solid #eee;
}

/* 用户信息卡片 */
.user-card {
  background-color: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-label {
  font-size: 28rpx;
  color: #666;
}

.user-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 通用总计样式 */
.total-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.total-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff6b35;
}

/* 协议区域 */
.agreement-section {
  background-color: #fff;
  margin: 0 24rpx 16rpx;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.agreement-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #ddd;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
  transition: all 0.2s;
}

.checkbox.checked {
  background-color: #ff6b35;
  border-color: #ff6b35;
}

.checkmark {
  font-size: 20rpx;
  color: #fff;
  font-weight: bold;
}

.agreement-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.agreement-link {
  color: #ff6b35;
  text-decoration: underline;
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

.price-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.price-label {
  font-size: 24rpx;
  color: #666;
}

.price-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff6b35;
}

.submit-button {
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

.submit-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>