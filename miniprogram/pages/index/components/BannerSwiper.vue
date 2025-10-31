<template>
  <view class="banner-swiper">
    <swiper
      class="swiper"
      :indicator-dots="true"
      :autoplay="true"
      :interval="3000"
      :duration="500"
      :circular="true"
      indicator-color="rgba(255, 255, 255, 0.5)"
      indicator-active-color="#ffffff"
    >
      <swiper-item
        v-for="(banner, index) in banners"
        :key="index"
        @click="handleBannerClick(banner)"
      >
        <view class="swiper-item">
          <image
            v-if="banner.imageUrl"
            :src="banner.imageUrl"
            class="banner-image"
            mode="aspectFill"
          />
          <view v-else class="banner-placeholder">
            <text class="banner-text">{{ banner.title }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
interface Banner {
  id?: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
}

interface Props {
  banners?: Banner[];
}

const props = withDefaults(defineProps<Props>(), {
  banners: () => [
    { title: "🎉 营销活动 1" },
    { title: "🎊 营销活动 2" },
    { title: "🎁 营销活动 3" },
  ],
});

const emit = defineEmits<{
  click: [banner: Banner];
}>();

const handleBannerClick = (banner: Banner) => {
  emit("click", banner);
};
</script>

<style scoped>
.banner-swiper {
  position: relative;
  height: 320rpx;
  overflow: hidden;
  margin: 16rpx 24rpx;
  border-radius: 16rpx;
}

.swiper {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.swiper-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
  border-radius: 16rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.banner-text {
  color: white;
  font-size: 72rpx;
  font-weight: 600;
  text-align: center;
}
</style>
