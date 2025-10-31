<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration"></view>

    <!-- 主容器 -->
    <view class="login-container">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <view class="logo">🚐</view>
        <view class="app-name">叨叨房车</view>
        <view class="app-slogan">开启您的房车之旅</view>
      </view>

      <!-- 登录方式切换 -->
      <view class="login-mode-switch">
        <view
          :class="['mode-btn', { active: loginMode === 'quick' }]"
          @click="switchMode('quick')"
        >
          一键登录
        </view>
        <view
          :class="['mode-btn', { active: loginMode === 'phone' }]"
          @click="switchMode('phone')"
        >
          手机号登录
        </view>
      </view>

      <!-- 一键登录内容 -->
      <view v-if="loginMode === 'quick'" class="login-content">
        <view class="quick-login-section">
          <view class="platform-btn wechat" @click="handleQuickLogin('wechat')">
            <text class="platform-icon">💬</text>
            <text>微信一键登录</text>
          </view>
          <view class="platform-btn alipay" @click="handleQuickLogin('alipay')">
            <text class="platform-icon">💳</text>
            <text>支付宝一键登录</text>
          </view>
          <view class="platform-btn douyin" @click="handleQuickLogin('douyin')">
            <text class="platform-icon">🎵</text>
            <text>抖音一键登录</text>
          </view>
        </view>

        <!-- 提示信息 -->
        <view v-if="showPlatformTip" class="tip-section">
          ⚠️ 当前平台不支持一键登录,请使用手机号登录
        </view>
      </view>

      <!-- 手机号登录内容 -->
      <view v-if="loginMode === 'phone'" class="login-content">
        <view class="phone-login-section">
          <!-- 手机号输入 -->
          <view class="form-group">
            <text class="form-label">手机号</text>
            <input
              v-model="phoneForm.phone"
              type="number"
              class="form-input"
              placeholder="请输入11位手机号"
              maxlength="11"
            />
          </view>

          <!-- 验证码输入 -->
          <view class="form-group">
            <text class="form-label">验证码</text>
            <view class="input-wrapper">
              <input
                v-model="phoneForm.code"
                type="number"
                class="form-input code-input"
                placeholder="请输入6位验证码"
                maxlength="6"
              />
              <view
                :class="['code-btn', { disabled: countdown > 0 }]"
                @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : "获取验证码" }}
              </view>
            </view>
          </view>

          <!-- 登录按钮 -->
          <view class="login-btn" @click="handlePhoneLogin">登录</view>
        </view>
      </view>

      <!-- 用户协议 -->
      <view class="agreement-section">
        <checkbox-group @change="handleAgreementChange">
          <label class="agreement-label">
            <checkbox
              :checked="agreementChecked"
              color="#FF9F29"
              class="agreement-checkbox"
            />
            <text class="agreement-text">
              我已阅读并同意
              <text class="agreement-link" @click.stop="viewAgreement('user')"
                >《用户协议》</text
              >
              和
              <text
                class="agreement-link"
                @click.stop="viewAgreement('privacy')"
                >《隐私政策》</text
              >
            </text>
          </label>
        </checkbox-group>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/modules/user";
import router from "@/utils/router";

// 状态管理
const userStore = useUserStore();

// 登录模式 - 默认使用手机号登录(方便测试)
const loginMode = ref<"quick" | "phone">("phone");

// 手机号登录表单
const phoneForm = ref({
  phone: "",
  code: "",
});

// 验证码倒计时
const countdown = ref(0);
let timer: number | null = null;

// 用户协议
const agreementChecked = ref(false);

// 平台提示
const showPlatformTip = ref(false);

/**
 * 切换登录方式
 */
const switchMode = (mode: "quick" | "phone") => {
  loginMode.value = mode;
  showPlatformTip.value = false;
};

/**
 * 检查用户协议
 */
const checkAgreement = (): boolean => {
  if (!agreementChecked.value) {
    uni.showToast({
      title: "请先阅读并同意用户协议和隐私政策",
      icon: "none",
      duration: 2000,
    });
    return false;
  }
  return true;
};

/**
 * 一键登录
 */
const handleQuickLogin = async (platform: "wechat" | "alipay" | "douyin") => {
  if (!checkAgreement()) return;

  try {
    // 检测当前平台
    // #ifdef H5
    showPlatformTip.value = true;
    setTimeout(() => {
      switchMode("phone");
    }, 2000);
    return;
    // #endif

    uni.showLoading({ title: "登录中..." });

    let result;
    if (platform === "wechat") {
      // #ifdef MP-WEIXIN
      const { code } = await uni.login();
      result = await userStore.wechatLogin({ code });
      // #endif
    } else if (platform === "alipay") {
      // #ifdef MP-ALIPAY
      const { authCode } = await uni.getAuthCode({ scopes: ["auth_user"] });
      result = await userStore.alipayLogin({ authCode });
      // #endif
    } else if (platform === "douyin") {
      // #ifdef MP-TOUTIAO
      const { code } = await uni.login();
      result = await userStore.douyinLogin({ code });
      // #endif
    }

    if (result) {
      uni.hideLoading();
      uni.showToast({ title: "登录成功", icon: "success" });

      // 跳转到重定向路径或首页
      const redirectPath = userStore.redirectPath || "/pages/index/index";
      userStore.clearRedirectPath();

      setTimeout(() => {
        uni.reLaunch({ url: redirectPath });
      }, 1000);
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || "登录失败",
      icon: "none",
      duration: 2000,
    });
  }
};

/**
 * 发送验证码
 */
const handleSendCode = async () => {
  if (countdown.value > 0) return;

  const phone = phoneForm.value.phone.trim();

  // 验证手机号
  if (!phone || phone.length !== 11) {
    uni.showToast({
      title: "请输入正确的11位手机号",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    uni.showToast({
      title: "手机号格式不正确",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  try {
    uni.showLoading({ title: "发送中..." });
    await userStore.sendCode(phone);
    uni.hideLoading();

    uni.showToast({
      title: "验证码已发送",
      icon: "success",
      duration: 2000,
    });

    // 开始倒计时
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        if (timer) clearInterval(timer);
      }
    }, 1000) as unknown as number;
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || "发送失败",
      icon: "none",
      duration: 2000,
    });
  }
};

/**
 * 手机号登录
 */
const handlePhoneLogin = async () => {
  if (!checkAgreement()) return;

  const { phone, code } = phoneForm.value;

  // 验证手机号
  if (!phone || phone.length !== 11) {
    uni.showToast({
      title: "请输入正确的11位手机号",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  // 验证验证码
  if (!code || code.length !== 6) {
    uni.showToast({
      title: "请输入6位验证码",
      icon: "none",
      duration: 2000,
    });
    return;
  }

  try {
    uni.showLoading({ title: "登录中..." });
    await userStore.smsLogin({ phone, code });
    uni.hideLoading();

    uni.showToast({ title: "登录成功", icon: "success" });

    // 跳转到重定向路径或首页
    const redirectPath = userStore.redirectPath || "/pages/index/index";
    userStore.clearRedirectPath();

    setTimeout(() => {
      uni.reLaunch({ url: redirectPath });
    }, 1000);
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || "登录失败",
      icon: "none",
      duration: 2000,
    });
  }
};

/**
 * 用户协议变更
 */
const handleAgreementChange = (e: any) => {
  agreementChecked.value = e.detail.value.length > 0;
};

/**
 * 查看协议
 */
const viewAgreement = (type: "user" | "privacy") => {
  uni.showToast({
    title: `查看${type === "user" ? "用户协议" : "隐私政策"}`,
    icon: "none",
    duration: 2000,
  });
  // TODO: 跳转到协议页面
};

/**
 * 页面加载
 */
onMounted(() => {
  // H5 平台显示提示
  // #ifdef H5
  showPlatformTip.value = true;
  // #endif
});
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #8860d0 0%, #a78bdb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: fixed;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  pointer-events: none;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-20px, -20px) rotate(5deg);
  }
}

// 主容器
.login-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 32px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 80px 20px;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Logo 区域
.logo-section {
  text-align: center;
  margin-bottom: 48px;
}

.logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #8860d0 0%, #a78bdb 100%);
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #ffffff;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(136, 96, 208, 0.3);
}

.app-name {
  font-size: 28px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.app-slogan {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 400;
}

// 登录方式切换
.login-mode-switch {
  display: flex;
  background: #f5f7fa;
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 32px;
}

.mode-btn {
  flex: 1;
  padding: 12px 16px;
  text-align: center;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.6);
  background: transparent;
  border-radius: 12px;
  font-weight: 500;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-btn.active {
  color: #ff9f29;
  font-weight: 600;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

// 登录内容
.login-content {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 一键登录
.quick-login-section {
  margin-bottom: 24px;
}

.platform-btn {
  width: 100%;
  min-height: 52px;
  padding: 0 20px;
  margin-bottom: 16px;
  border: 2px solid;
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-btn.wechat {
  color: #67c23a;
  border-color: #67c23a;
}

.platform-btn.alipay {
  color: #4b91ff;
  border-color: #4b91ff;
}

.platform-btn.douyin {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.platform-icon {
  font-size: 22px;
  margin-right: 10px;
}

// 手机号登录
.phone-login-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 12px;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: 2px solid #e8eaed;
  border-radius: 14px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.9);
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  border-color: #ff9f29;
  box-shadow: 0 0 0 4px rgba(255, 159, 41, 0.1);
}

.code-input {
  padding-right: 110px;
}

.code-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 12px 20px;
  background: linear-gradient(135deg, #8860d0 0%, #9a73db 100%);
  color: #ffffff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.code-btn.disabled {
  background: #e8eaed;
  color: rgba(0, 0, 0, 0.35);
}

.login-btn {
  width: 100%;
  min-height: 52px;
  background: linear-gradient(135deg, #ff9f29 0%, #ffb347 100%);
  color: #ffffff;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  margin-top: 32px;
  box-shadow: 0 4px 16px rgba(255, 159, 41, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 用户协议
.agreement-section {
  margin-top: 32px;
}

.agreement-label {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.6;
}

.agreement-checkbox {
  margin-right: 10px;
  margin-top: 1px;
  transform: scale(1.2);
}

.agreement-text {
  flex: 1;
}

.agreement-link {
  color: #4b91ff;
  font-weight: 500;
}

// 提示信息
.tip-section {
  margin-top: 24px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff8f0 0%, #fffbf5 100%);
  border-left: 4px solid #ff9f29;
  border-radius: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式
@media (max-width: 480px) {
  .login-container {
    margin: 60px 16px;
    padding: 40px 24px 32px;
    border-radius: 20px;
  }

  .logo {
    width: 72px;
    height: 72px;
    font-size: 32px;
  }

  .app-name {
    font-size: 24px;
  }
}
</style>
