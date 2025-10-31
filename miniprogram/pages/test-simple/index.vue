<template>
  <view class="container">
    <view class="header">
      <text class="title">简单测试页面</text>
    </view>

    <view class="section">
      <view class="section-title">基本信息</view>
      <view class="info-item">
        <text>页面加载成功!</text>
      </view>
      <view class="info-item">
        <text>计数器: {{ count }}</text>
      </view>
      <button @click="increment" class="test-btn">点击 +1</button>
    </view>

    <view class="section">
      <view class="section-title">路由测试</view>
      <button @click="goBack" class="test-btn">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);

function increment() {
  count.value++;
  console.log("计数器:", count.value);
}

function goBack() {
  uni.navigateBack();
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

.test-btn {
  margin-top: 15rpx;
  background-color: #667eea;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 28rpx;
}
</style>

