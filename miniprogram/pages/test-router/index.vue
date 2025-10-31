<template>
  <view class="container">
    <view class="header">
      <text class="title">路由功能测试页面</text>
    </view>

    <!-- 用户状态显示 -->
    <view class="section">
      <view class="section-title">用户状态</view>
      <view class="info-item">
        <text>登录状态: {{ isLogin ? "已登录" : "未登录" }}</text>
      </view>
      <view class="info-item">
        <text>实名认证: {{ isRealNameVerified ? "已认证" : "未认证" }}</text>
      </view>
      <view class="info-item">
        <text
          >驾照认证: {{ isDriverLicenseVerified ? "已认证" : "未认证" }}</text
        >
      </view>
      <view class="info-item">
        <text>用户昵称: {{ nickname }}</text>
      </view>
    </view>

    <!-- 路由跳转测试 -->
    <view class="section">
      <view class="section-title">路由跳转测试</view>

      <!-- 白名单页面 -->
      <view class="test-group">
        <text class="group-title">白名单页面(无需认证)</text>
        <button @click="goToHome" class="test-btn">跳转到首页</button>
        <button @click="goToCommunity" class="test-btn">跳转到社区</button>
      </view>

      <!-- 需要登录的页面 -->
      <view class="test-group">
        <text class="group-title">需要登录的页面</text>
        <button @click="goToMine" class="test-btn">跳转到我的</button>
        <button @click="goToService" class="test-btn">跳转到客服</button>
      </view>

      <!-- 需要实名认证的页面 -->
      <view class="test-group">
        <text class="group-title">需要实名认证的页面</text>
        <button @click="goToOrderConfirm" class="test-btn">
          跳转到订单确认
        </button>
        <button @click="goToWallet" class="test-btn">跳转到钱包</button>
      </view>

      <!-- 需要驾照认证的页面 -->
      <view class="test-group">
        <text class="group-title">需要驾照认证的页面</text>
        <button @click="goToRvRental" class="test-btn">跳转到房车租赁</button>
      </view>
    </view>

    <!-- 用户操作 -->
    <view class="section">
      <view class="section-title">用户操作</view>
      <button @click="mockLogin" class="action-btn primary">模拟登录</button>
      <button @click="mockRealName" class="action-btn success">
        模拟实名认证
      </button>
      <button @click="mockDriverLicense" class="action-btn success">
        模拟驾照认证
      </button>
      <button @click="handleLogout" class="action-btn danger">退出登录</button>
    </view>

    <!-- 重定向路径 -->
    <view class="section">
      <view class="section-title">重定向路径</view>
      <view class="info-item">
        <text>当前重定向路径: {{ redirectPath || "无" }}</text>
      </view>
      <button @click="clearRedirect" class="test-btn">清除重定向路径</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import router from "@/utils/router";

const redirectPath = ref("");
const isLogin = ref(false);
const isRealNameVerified = ref(false);
const isDriverLicenseVerified = ref(false);
const nickname = ref("");

onMounted(() => {
  console.log("测试页面加载");
  loadUserInfo();
  updateRedirectPath();
});

// 从 localStorage 加载用户信息
function loadUserInfo() {
  try {
    const token = uni.getStorageSync("access_token");
    isLogin.value = !!token;

    const userInfoStr = uni.getStorageSync("user_info");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      nickname.value = userInfo.nickname || "";
      isRealNameVerified.value = userInfo.isRealNameVerified || false;
      isDriverLicenseVerified.value = userInfo.isDriverLicenseVerified || false;
    }

    console.log("用户状态:", {
      isLogin: isLogin.value,
      isRealNameVerified: isRealNameVerified.value,
      isDriverLicenseVerified: isDriverLicenseVerified.value,
      nickname: nickname.value,
    });
  } catch (error) {
    console.error("加载用户信息失败:", error);
  }
}

// 更新重定向路径显示
function updateRedirectPath() {
  redirectPath.value = router.getRedirectPath();
}

// ==================== 白名单页面 ====================
function goToHome() {
  router.switchTab({ url: "/pages/index/index" });
}

function goToCommunity() {
  router.switchTab({ url: "/pages/community/index" });
}

// ==================== 需要登录的页面 ====================
function goToMine() {
  router.switchTab({ url: "/pages/mine/index" });
  setTimeout(updateRedirectPath, 500);
}

function goToService() {
  router.switchTab({ url: "/pages/service/index" });
  setTimeout(updateRedirectPath, 500);
}

// ==================== 需要实名认证的页面 ====================
function goToOrderConfirm() {
  router.navigateTo({ url: "/pages/order/confirm?vehicleId=123" });
  setTimeout(updateRedirectPath, 500);
}

function goToWallet() {
  router.navigateTo({ url: "/pages/wallet/index" });
  setTimeout(updateRedirectPath, 500);
}

// ==================== 需要驾照认证的页面 ====================
function goToRvRental() {
  router.navigateTo({ url: "/pages/rv-rental/order-confirm?vehicleId=123" });
  setTimeout(updateRedirectPath, 500);
}

// ==================== 用户操作 ====================
function mockLogin() {
  // 模拟登录成功
  userStore.token = "mock_token_123456";
  userStore.userInfo = {
    id: "1",
    phone: "13800138000",
    nickname: "测试用户",
    avatar: "",
    isRealNameVerified: false,
    isDriverLicenseVerified: false,
  };
  userStore.isAuthenticated = true;

  // 保存到 localStorage
  uni.setStorageSync("access_token", "mock_token_123456");
  uni.setStorageSync("user_info", JSON.stringify(userStore.userInfo));

  uni.showToast({
    title: "登录成功",
    icon: "success",
  });
}

function mockRealName() {
  if (!userStore.isLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  // 模拟实名认证成功
  if (userStore.userInfo) {
    userStore.userInfo.isRealNameVerified = true;
    userStore.userInfo.realName = "张三";
    userStore.userInfo.idCard = "110101199001011234";

    // 保存到 localStorage
    uni.setStorageSync("user_info", JSON.stringify(userStore.userInfo));

    uni.showToast({
      title: "实名认证成功",
      icon: "success",
    });
  }
}

function mockDriverLicense() {
  if (!userStore.isLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  if (!userStore.isRealNameVerified) {
    uni.showToast({
      title: "请先完成实名认证",
      icon: "none",
    });
    return;
  }

  // 模拟驾照认证成功
  if (userStore.userInfo) {
    userStore.userInfo.isDriverLicenseVerified = true;
    userStore.userInfo.driverLicense = "C1";

    // 保存到 localStorage
    uni.setStorageSync("user_info", JSON.stringify(userStore.userInfo));

    uni.showToast({
      title: "驾照认证成功",
      icon: "success",
    });
  }
}

function handleLogout() {
  userStore.logout();
}

function clearRedirect() {
  router.clearRedirectPath();
  updateRedirectPath();
  uni.showToast({
    title: "已清除",
    icon: "success",
  });
}
</script>

<style scoped lang="scss">
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.section {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 2rpx solid #eeeeee;
}

.info-item {
  padding: 15rpx 0;
  font-size: 28rpx;
  color: #666666;
}

.test-group {
  margin-bottom: 30rpx;
}

.group-title {
  display: block;
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 15rpx;
}

.test-btn {
  margin-bottom: 15rpx;
  background-color: #f0f0f0;
  color: #333333;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.action-btn {
  margin-bottom: 15rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #ffffff;
}

.danger {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #ffffff;
}
</style>
