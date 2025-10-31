<template>
  <view class="container">
    <view class="header">
      <text class="title">路由功能测试页面 V2</text>
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
        <text class="group-title">✅ 白名单页面(无需认证)</text>
        <button @click="goToHome" class="test-btn">跳转到首页 (TabBar)</button>
        <button @click="goToCommunity" class="test-btn">
          跳转到社区 (TabBar)
        </button>
      </view>

      <!-- 需要登录的页面 -->
      <view class="test-group">
        <text class="group-title">🔐 需要登录的页面</text>
        <button @click="goToMine" class="test-btn">跳转到我的 (TabBar)</button>
        <button @click="goToService" class="test-btn">
          跳转到客服 (TabBar)
        </button>
      </view>

      <!-- 测试说明 -->
      <view class="test-group">
        <text class="group-title">📝 测试说明</text>
        <view class="info-item">
          <text>1. 白名单页面可直接访问</text>
        </view>
        <view class="info-item">
          <text>2. 需要登录的页面会拦截未登录用户</text>
        </view>
        <view class="info-item">
          <text>3. TabBar 页面会自动使用 switchTab 跳转</text>
        </view>
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
      <button @click="mockLogout" class="action-btn danger">退出登录</button>
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
  console.log("测试页面 V2 加载");
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

// ==================== 路由跳转测试 ====================
function goToHome() {
  console.log("跳转到首页 (TabBar 页面)");
  router.navigateTo({ url: "/pages/index/index" });
  setTimeout(updateRedirectPath, 500);
}

function goToCommunity() {
  console.log("跳转到社区 (TabBar 页面)");
  router.navigateTo({ url: "/pages/community/index" });
  setTimeout(updateRedirectPath, 500);
}

function goToMine() {
  console.log("跳转到我的 (TabBar 页面,需要登录)");
  router.navigateTo({ url: "/pages/mine/index" });
  setTimeout(updateRedirectPath, 500);
}

function goToService() {
  console.log("跳转到客服 (TabBar 页面,需要登录)");
  router.navigateTo({ url: "/pages/service/index" });
  setTimeout(updateRedirectPath, 500);
}

// ==================== 用户操作 ====================
function mockLogin() {
  const userInfo = {
    id: "1",
    phone: "13800138000",
    nickname: "测试用户",
    avatar: "",
    isRealNameVerified: false,
    isDriverLicenseVerified: false,
  };

  uni.setStorageSync("access_token", "mock_token_123456");
  uni.setStorageSync("user_info", JSON.stringify(userInfo));

  loadUserInfo();

  uni.showToast({
    title: "登录成功",
    icon: "success",
  });
}

function mockRealName() {
  if (!isLogin.value) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  try {
    const userInfoStr = uni.getStorageSync("user_info");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      userInfo.isRealNameVerified = true;
      userInfo.realName = "张三";
      userInfo.idCard = "110101199001011234";

      uni.setStorageSync("user_info", JSON.stringify(userInfo));
      loadUserInfo();

      uni.showToast({
        title: "实名认证成功",
        icon: "success",
      });
    }
  } catch (error) {
    console.error("实名认证失败:", error);
  }
}

function mockDriverLicense() {
  if (!isLogin.value) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    return;
  }

  if (!isRealNameVerified.value) {
    uni.showToast({
      title: "请先完成实名认证",
      icon: "none",
    });
    return;
  }

  try {
    const userInfoStr = uni.getStorageSync("user_info");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      userInfo.isDriverLicenseVerified = true;
      userInfo.driverLicense = "C1";

      uni.setStorageSync("user_info", JSON.stringify(userInfo));
      loadUserInfo();

      uni.showToast({
        title: "驾照认证成功",
        icon: "success",
      });
    }
  } catch (error) {
    console.error("驾照认证失败:", error);
  }
}

function mockLogout() {
  uni.removeStorageSync("access_token");
  uni.removeStorageSync("user_info");

  loadUserInfo();

  uni.showToast({
    title: "已退出登录",
    icon: "success",
  });
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

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  display: block;
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 15rpx;
}

.test-btn {
  margin-top: 15rpx;
  background-color: #ffffff;
  color: #667eea;
  border: 2rpx solid #667eea;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.action-btn {
  margin-top: 15rpx;
  border-radius: 10rpx;
  font-size: 28rpx;

  &.primary {
    background-color: #667eea;
    color: #ffffff;
  }

  &.success {
    background-color: #52c41a;
    color: #ffffff;
  }

  &.danger {
    background-color: #ff4d4f;
    color: #ffffff;
  }
}
</style>
