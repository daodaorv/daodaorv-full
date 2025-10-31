<template>
  <view class="service-grid-section">
    <view class="service-grid">
      <view
        v-for="(service, index) in services"
        :key="index"
        class="grid-item"
        @click="handleServiceClick(service)"
      >
        <view class="grid-icon">{{ service.icon }}</view>
        <text class="grid-text">{{ service.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Service {
  icon: string;
  name: string;
  path?: string;
}

interface Props {
  services?: Service[];
}

const props = withDefaults(defineProps<Props>(), {
  services: () => [
    { icon: "🎁", name: "特惠租车" },
    { icon: "🚐", name: "房车租赁" },
    { icon: "🏕️", name: "营地预订" },
    { icon: "✈️", name: "定制旅游" },
    { icon: "💰", name: "众筹房车" },
    { icon: "📢", name: "推广分享" },
    { icon: "🤝", name: "加盟合作" },
    { icon: "👑", name: "PLUS会员" },
  ],
});

const emit = defineEmits<{
  serviceClick: [service: Service];
}>();

const handleServiceClick = (service: Service) => {
  emit("serviceClick", service);
};
</script>

<style scoped>
.service-grid-section {
  margin: 24rpx;
  background: white;
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.04);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 16rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
}

.grid-item:active {
  transform: scale(0.95);
}

.grid-icon {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  box-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.2);
  transition: all 0.2s;
}

.grid-item:active .grid-icon {
  box-shadow: 0 1rpx 4rpx rgba(139, 92, 246, 0.3);
}

.grid-text {
  font-size: 22rpx;
  color: #212529;
  text-align: center;
  line-height: 1.3;
}
</style>
