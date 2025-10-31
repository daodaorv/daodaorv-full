<template>
  <view class="vehicle-card" @click="handleClick">
    <!-- 车辆图片轮播 -->
    <view class="image-container">
      <swiper
        class="image-swiper"
        :indicator-dots="images.length > 1"
        :autoplay="false"
        :interval="3000"
        :duration="500"
        indicator-color="rgba(255, 255, 255, 0.5)"
        indicator-active-color="#8860D0"
      >
        <swiper-item v-for="(image, index) in images" :key="index">
          <image
            :src="image"
            class="vehicle-image"
            mode="aspectFill"
            @click.stop="previewImage(index)"
          />
        </swiper-item>
      </swiper>

      <!-- 收藏按钮 -->
      <view class="favorite-btn" @click.stop="toggleFavorite">
        <u-icon
          :name="isFavorited ? 'heart-fill' : 'heart'"
          :color="isFavorited ? '#FF4757' : '#ffffff'"
          size="20"
        />
      </view>

      <!-- 分享按钮 -->
      <view class="share-btn" @click.stop="handleShare">
        <u-icon
          name="share"
          color="#ffffff"
          size="20"
        />
      </view>

      <!-- 标签 -->
      <view class="tags" v-if="tags.length > 0">
        <u-tag
          v-for="(tag, index) in tags.slice(0, 2)"
          :key="index"
          :text="tag"
          type="primary"
          size="mini"
          plain
          class="tag"
        />
      </view>
    </view>

    <!-- 车辆信息 -->
    <view class="info-container">
      <!-- 车型名称 -->
      <view class="name">{{ name }}</view>

      <!-- 价格信息 -->
      <view class="price-section">
        <view class="price">
          <text class="currency">¥</text>
          <text class="amount">{{ formatPrice(dailyPrice) }}</text>
          <text class="unit">/天</text>
        </view>
        <view class="original-price" v-if="originalPrice > dailyPrice">
          ¥{{ formatPrice(originalPrice) }}/天
        </view>
      </view>

      <!-- 基本参数 -->
      <view class="specs">
        <view class="spec-item">
          <u-icon name="account" size="14" color="#666" />
          <text class="spec-text">{{ seatCount }}座</text>
        </view>
        <view class="spec-item">
          <u-icon name="home" size="14" color="#666" />
          <text class="spec-text">{{ bedCount }}床</text>
        </view>
        <view class="spec-item">
          <u-icon name="star" size="14" color="#FFB800" />
          <text class="spec-text rating">{{ rating }}</text>
          <text class="review-count">({{ reviewCount }})</text>
        </view>
      </view>

      <!-- 特色设施 -->
      <view class="facilities" v-if="facilities.length > 0">
        <view
          class="facility-item"
          v-for="(facility, index) in facilities.slice(0, 4)"
          :key="index"
        >
          <u-icon :name="getFacilityIcon(facility)" size="12" color="#8860D0" />
          <text class="facility-text">{{ facility }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { showShareMenu } from '@/utils/share';

interface Props {
  id: string;
  name: string;
  images: string[];
  dailyPrice: number;
  originalPrice?: number;
  seatCount: number;
  bedCount: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  facilities?: string[];
  isFavorited?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  originalPrice: 0,
  tags: () => [],
  facilities: () => [],
  isFavorited: false,
});

const emit = defineEmits<{
  click: [id: string];
  'toggle-favorite': [id: string, isFavorited: boolean];
  'preview-image': [images: string[], current: number];
}>();

// 价格格式化
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0';
  return numPrice.toFixed(0);
};

// 设施图标映射
const getFacilityIcon = (facility: string): string => {
  const iconMap: { [key: string]: string } = {
    'WiFi': 'wifi',
    '空调': 'thermometer',
    '厨房': 'kitchen',
    '卫生间': 'toilet',
    '淋浴': 'shower',
    '电视': 'play-circle',
    '冰箱': 'shopping-bag',
    '微波炉': 'setting',
    '热水器': 'water',
    '发电机': 'battery',
    '太阳能': 'sunny',
    '音响': 'sound',
    '导航': 'map',
    '倒车影像': 'camera',
    '行车记录仪': 'camera-reverse',
  };
  return iconMap[facility] || 'checkmark';
};

// 处理卡片点击
const handleClick = () => {
  emit('click', props.id);
};

// 处理收藏切换
const toggleFavorite = () => {
  emit('toggle-favorite', props.id, !props.isFavorited);
};

// 预览图片
const previewImage = (index: number) => {
  emit('preview-image', props.images, index);
};

// 处理分享
const handleShare = () => {
  const vehicleData = {
    id: props.id,
    modelName: props.name,
    images: props.images,
    dailyPrice: props.dailyPrice,
    seatCount: props.seatCount,
    bedCount: props.bedCount,
    rating: props.rating,
  };

  showShareMenu(vehicleData);
};
</script>

<style lang="scss" scoped>
.vehicle-card {
  background: #ffffff;
  border-radius: 12rpx;
  margin: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.image-container {
  position: relative;
  height: 400rpx;

  .image-swiper {
    height: 100%;

    .vehicle-image {
      width: 100%;
      height: 100%;
      border-radius: 12rpx 12rpx 0 0;
    }
  }

  .favorite-btn {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 60rpx;
    height: 60rpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10rpx);
  }

  .share-btn {
    position: absolute;
    top: 20rpx;
    right: 90rpx;
    width: 60rpx;
    height: 60rpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10rpx);
  }

  .tags {
    position: absolute;
    bottom: 20rpx;
    left: 20rpx;
    display: flex;
    gap: 10rpx;

    .tag {
      background: rgba(136, 96, 208, 0.9);
      border: none;
    }
  }
}

.info-container {
  padding: 30rpx;

  .name {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    line-height: 1.4;
    margin-bottom: 20rpx;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price-section {
    display: flex;
    align-items: baseline;
    margin-bottom: 20rpx;

    .price {
      display: flex;
      align-items: baseline;

      .currency {
        font-size: 24rpx;
        color: #FF6B35;
        font-weight: 500;
      }

      .amount {
        font-size: 40rpx;
        font-weight: 700;
        color: #FF6B35;
        line-height: 1;
      }

      .unit {
        font-size: 24rpx;
        color: #999999;
        margin-left: 4rpx;
      }
    }

    .original-price {
      font-size: 24rpx;
      color: #999999;
      text-decoration: line-through;
      margin-left: 20rpx;
    }
  }

  .specs {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    gap: 30rpx;

    .spec-item {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .spec-text {
        font-size: 26rpx;
        color: #666666;
      }

      .rating {
        color: #FFB800;
        font-weight: 500;
      }

      .review-count {
        font-size: 24rpx;
        color: #999999;
      }
    }
  }

  .facilities {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;

    .facility-item {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 8rpx 16rpx;
      background: #F8F9FA;
      border-radius: 20rpx;

      .facility-text {
        font-size: 24rpx;
        color: #8860D0;
      }
    }
  }
}
</style>