<template>
  <view class="membership-card" @click="handleClick">
    <view class="membership-title">加入会员</view>
    <view class="membership-subtitle">享受专属高端服务</view>
    <view class="membership-benefits">
      <view class="benefit-item">🎁 会员礼包</view>
      <view class="benefit-item">💎 U会员</view>
      <view class="benefit-item">📦 专属包</view>
    </view>
    <button class="membership-button">立即加入</button>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [];
}>();

const handleClick = () => {
  emit("click");
};
</script>

<style scoped>
.membership-card {
  margin: 24rpx;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 20rpx;
  padding: 24rpx;
  color: white;
  box-shadow: 0 2rpx 12rpx rgba(139, 92, 246, 0.2);
  transition: all 0.2s;
}

.membership-card:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 8rpx rgba(139, 92, 246, 0.25);
}

.membership-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.membership-subtitle {
  font-size: 22rpx;
  opacity: 0.85;
  margin-bottom: 16rpx;
}

.membership-benefits {
  display: flex;
  gap: 8rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}

.benefit-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 16rpx;
  border-radius: 32rpx;
  font-size: 20rpx;
  line-height: 1.4;
}

.membership-button {
  width: 100%;
  background: white;
  color: #8b5cf6;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0;
  border-radius: 36rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  text-align: center;
}

.membership-button::after {
  border: none;
}
</style>
