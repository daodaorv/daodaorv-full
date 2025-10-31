<template>
  <view
    class="special-offers-section"
    v-if="props.offers && props.offers.length > 0"
  >
    <view class="section-header">
      <view class="section-title">特惠商城</view>
      <view class="section-more" @click="handleMoreClick"> 更多 › </view>
    </view>
    <view class="offers-container">
      <!-- 左侧大卡片 -->
      <view
        v-if="props.offers[0]"
        class="offer-card offer-card-large"
        @click="handleOfferClick(props.offers[0])"
      >
        <view class="offer-title">{{ props.offers[0].title }}</view>
        <view class="offer-subtitle">{{ props.offers[0].subtitle }}</view>
        <view class="offer-price">
          ¥{{ props.offers[0].price }}
          <text class="offer-price-unit">起</text>
        </view>
        <button class="offer-button">抢购</button>
      </view>

      <!-- 右侧小卡片 -->
      <view class="offer-cards-small">
        <view
          v-for="(offer, index) in props.offers.slice(1, 3)"
          :key="index"
          class="offer-card offer-card-small"
          @click="handleOfferClick(offer)"
        >
          <view class="offer-title">{{ offer.title }}</view>
          <view class="offer-subtitle">{{ offer.subtitle }}</view>
          <view class="offer-price">
            ¥{{ offer.price }}
            <text class="offer-price-unit">起</text>
          </view>
          <button class="offer-button">抢购</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Offer {
  title: string;
  subtitle: string;
  price: number;
}

interface Props {
  offers?: Offer[];
}

const props = withDefaults(defineProps<Props>(), {
  offers: () => [
    { title: "房车租赁", subtitle: "适用于3天租期", price: 50 },
    { title: "思特租车", subtitle: "楼盘", price: 200 },
    { title: "长期租赁", subtitle: "适用于1个月", price: 500 },
    { title: "会员专享", subtitle: "适用于高端房车", price: 1000 },
  ],
});

const emit = defineEmits<{
  offerClick: [offer: Offer];
  moreClick: [];
}>();

const handleOfferClick = (offer: Offer) => {
  emit("offerClick", offer);
};

const handleMoreClick = () => {
  emit("moreClick");
};
</script>

<style scoped>
.special-offers-section {
  margin: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #212529;
}

.section-more {
  font-size: 28rpx;
  color: #6c757d;
}

.offers-container {
  display: flex;
  gap: 12rpx;
}

.offer-card {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  color: white;
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 53, 0.2);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.offer-card:active {
  transform: scale(0.97);
  box-shadow: 0 1rpx 4rpx rgba(255, 107, 53, 0.3);
}

/* 左侧大卡片 */
.offer-card-large {
  flex: 1;
  min-height: 360rpx;
}

.offer-card-large .offer-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  line-height: 1.3;
}

.offer-card-large .offer-subtitle {
  font-size: 24rpx;
  opacity: 0.85;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.offer-card-large .offer-price {
  font-size: 56rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  line-height: 1.1;
}

/* 右侧小卡片容器 */
.offer-cards-small {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

/* 右侧小卡片 */
.offer-card-small {
  flex: 1;
  min-height: 174rpx;
}

.offer-card-small .offer-title {
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
  line-height: 1.3;
}

.offer-card-small .offer-subtitle {
  font-size: 20rpx;
  opacity: 0.85;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.offer-card-small .offer-price {
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
  line-height: 1.1;
}

.offer-price-unit {
  font-size: 20rpx;
  font-weight: 400;
  opacity: 0.85;
  margin-left: 2rpx;
}

.offer-button {
  width: 100%;
  background: white;
  color: #ff6b35;
  height: 64rpx;
  line-height: 64rpx;
  padding: 0;
  border-radius: 32rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  flex-shrink: 0;
  text-align: center;
}

.offer-button::after {
  border: none;
}
</style>
