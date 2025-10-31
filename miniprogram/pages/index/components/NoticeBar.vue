<template>
  <view class="notice-bar" @click="handleNoticeClick">
    <text class="notice-icon">📢</text>
    <view class="notice-content">
      <text class="notice-text">{{ currentNotice }}</text>
    </view>
    <text class="notice-arrow">›</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
  notices?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  notices: () => [
    "【限时优惠】国庆房车租赁立减500元，先到先得！",
    "【新用户福利】注册即送200元优惠券",
    "【活动通知】周末房车露营活动火热报名中",
  ],
});

const emit = defineEmits<{
  click: [notice: string];
}>();

const currentNoticeIndex = ref(0);
const currentNotice = ref(props.notices[0]);
let timer: number | null = null;

// 轮播公告
const rotateNotice = () => {
  if (props.notices.length <= 1) return;

  currentNoticeIndex.value =
    (currentNoticeIndex.value + 1) % props.notices.length;
  currentNotice.value = props.notices[currentNoticeIndex.value];
};

// 点击公告栏
const handleNoticeClick = () => {
  emit("click", currentNotice.value);
};

onMounted(() => {
  if (props.notices.length > 1) {
    timer = setInterval(rotateNotice, 3000) as unknown as number;
  }
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.notice-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff8e1;
  gap: 12rpx;
}

.notice-icon {
  font-size: 24rpx;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  overflow: hidden;
}

.notice-text {
  display: inline-block;
  color: #ff6b00;
  font-size: 24rpx;
  white-space: nowrap;
}

.notice-arrow {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}
</style>
