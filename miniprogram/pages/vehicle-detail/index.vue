<template>
  <view class="vehicle-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 详情内容 -->
    <view v-else-if="vehicleData" class="detail-content">
      <!-- 图片轮播 -->
      <view class="image-swiper">
        <swiper
          class="swiper"
          :indicator-dots="true"
          :autoplay="false"
          :circular="true"
          indicator-color="rgba(255, 255, 255, 0.5)"
          indicator-active-color="#FF6B35"
        >
          <swiper-item
            v-for="(image, index) in vehicleData.images"
            :key="index"
          >
            <image
              :src="image"
              mode="aspectFill"
              class="swiper-image"
              @click="previewImage(index)"
            />
          </swiper-item>
        </swiper>
      </view>

      <!-- 基本信息 -->
      <view class="info-section">
        <!-- 标题和标签 -->
        <view class="title-row">
          <text class="vehicle-name">{{ vehicleData.name }}</text>
          <view class="tags">
            <text v-for="tag in vehicleData.tags" :key="tag" class="tag">{{
              tag
            }}</text>
          </view>
        </view>

        <!-- 价格和评分 -->
        <view class="price-rating-row">
          <view class="price-box">
            <text class="price-label">{{ priceLabel }}</text>
            <view class="price-row">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ vehicleData.price }}</text>
              <text class="price-unit">{{ priceUnit }}</text>
            </view>
            <text v-if="vehicleData.originalPrice" class="original-price">
              原价 ¥{{ vehicleData.originalPrice }}
            </text>
          </view>
          <view class="rating-box">
            <text class="rating-score">{{ vehicleData.rating || "5.0" }}</text>
            <text class="rating-count"
              >{{ vehicleData.reviewCount || 0 }}条评价</text
            >
          </view>
        </view>
      </view>

      <!-- 特惠套餐信息 (仅特惠租车显示) -->
      <view v-if="biz === 'special'" class="package-section">
        <view class="section-title">套餐详情</view>
        <view class="package-info">
          <view class="info-row">
            <text class="info-label">取车地点</text>
            <text class="info-value"
              >{{ vehicleData.pickupCity }} {{ vehicleData.pickupStore }}</text
            >
          </view>
          <view class="info-row">
            <text class="info-label">还车地点</text>
            <text class="info-value"
              >{{ vehicleData.returnCity }} {{ vehicleData.returnStore }}</text
            >
          </view>
          <view class="info-row">
            <text class="info-label">固定租期</text>
            <text class="info-value">{{ vehicleData.fixedDays }}天</text>
          </view>
          <view class="info-row">
            <text class="info-label">活动时间</text>
            <text class="info-value"
              >{{ vehicleData.startDate }} 至 {{ vehicleData.endDate }}</text
            >
          </view>
        </view>
      </view>

      <!-- 车辆参数 -->
      <view class="params-section">
        <view class="section-title">车辆参数</view>
        <view class="params-grid">
          <view class="param-item">
            <text class="param-label">座位数</text>
            <text class="param-value">{{ vehicleData.seatCount }}座</text>
          </view>
          <view class="param-item">
            <text class="param-label">床位数</text>
            <text class="param-value">{{ vehicleData.bedCount }}床</text>
          </view>
          <view class="param-item">
            <text class="param-label">车辆尺寸</text>
            <text class="param-value">{{ vehicleData.size }}</text>
          </view>
          <view class="param-item">
            <text class="param-label">车型分类</text>
            <text class="param-value">{{ vehicleData.category }}</text>
          </view>
        </view>
      </view>

      <!-- 配置清单 -->
      <view class="facilities-section">
        <view class="section-title">配置清单</view>
        <view class="facilities-list">
          <view
            v-for="facility in vehicleData.facilities"
            :key="facility"
            class="facility-item"
          >
            <text class="facility-icon">✓</text>
            <text class="facility-name">{{ facility }}</text>
          </view>
        </view>
      </view>

      <!-- 服务包含 -->
      <view class="services-section">
        <view class="section-title">服务包含</view>
        <view class="services-list">
          <view
            v-for="service in vehicleData.includedServices"
            :key="service"
            class="service-item"
          >
            <text class="service-icon">✓</text>
            <text class="service-name">{{ service }}</text>
          </view>
        </view>
      </view>

      <!-- 重要提示 -->
      <view class="notice-section">
        <view class="section-title">重要提示</view>
        <view class="notice-content">
          <text class="notice-text">{{
            vehicleData.notice || "请仔细阅读租赁合同条款"
          }}</text>
        </view>
      </view>

      <!-- 用户评价 -->
      <view class="reviews-section">
        <view class="section-header">
          <text class="section-title">用户评价</text>
          <text class="view-all" @click="viewAllReviews">查看全部 ></text>
        </view>
        <view v-if="reviews.length > 0" class="reviews-list">
          <view v-for="review in reviews" :key="review.id" class="review-item">
            <view class="review-header">
              <image :src="review.avatar" class="user-avatar" />
              <view class="user-info">
                <text class="user-name">{{ review.userName }}</text>
                <text class="review-date">{{ review.date }}</text>
              </view>
              <view class="review-rating">
                <text class="rating-text">{{ review.rating }}</text>
              </view>
            </view>
            <text class="review-content">{{ review.content }}</text>
          </view>
        </view>
        <view v-else class="empty-reviews">
          <text class="empty-text">暂无评价</text>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-text">加载失败,请重试</text>
      <button class="retry-button" @click="loadData">重新加载</button>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-buttons">
        <view class="icon-button" @click="handleCollect">
          <text class="icon">{{ isCollected ? "❤️" : "🤍" }}</text>
          <text class="button-text">收藏</text>
        </view>
        <view class="icon-button" @click="handleShare">
          <text class="icon">📤</text>
          <text class="button-text">分享</text>
        </view>
      </view>
      <button class="book-button" @click="handleBook">立即预订</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  getVehicleModelDetail,
  getSpecialOfferDetail,
  collectVehicle,
  uncollectVehicle,
} from "@/api/modules/vehicle";

// 页面参数
const biz = ref<"rv" | "special">("rv"); // 业务类型: rv=房车租赁, special=特惠租车
const id = ref<string>(""); // 车辆/套餐ID

// 页面状态
const loading = ref(true);
const vehicleData = ref<any>(null);
const reviews = ref<any[]>([]);
const isCollected = ref(false);

// 计算属性
const priceLabel = computed(() => {
  return biz.value === "special" ? "特惠价" : "日租金";
});

const priceUnit = computed(() => {
  return biz.value === "special" ? "起" : "/天";
});

/**
 * 页面加载
 */
onLoad((options: any) => {
  console.log("车辆详情页参数:", options);
  biz.value = options.biz || "rv";
  id.value = options.id || "";

  if (!id.value) {
    uni.showToast({
      title: "参数错误",
      icon: "none",
    });
    return;
  }

  loadData();
});

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    loading.value = true;

    // 根据业务类型调用不同API
    const apiCall =
      biz.value === "special"
        ? getSpecialOfferDetail(id.value)
        : getVehicleModelDetail(id.value);

    const res = await apiCall;

    if (res.data) {
      // 数据适配
      vehicleData.value = adaptVehicleData(res.data, biz.value);
    }
  } catch (error) {
    console.error("加载车辆详情失败:", error);
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 数据适配器 - 将后端数据转换为页面需要的格式
 */
const adaptVehicleData = (data: any, bizType: string) => {
  if (bizType === "special") {
    // 特惠套餐数据适配
    return {
      name: data.name,
      tags: ["限时特惠", "免费异地还车"],
      price: data.offerPrice,
      originalPrice: data.originalPrice,
      rating: "4.8",
      reviewCount: 0,
      pickupCity: data.pickupCity,
      returnCity: data.returnCity,
      pickupStore: "待分配",
      returnStore: "待分配",
      fixedDays: data.fixedDays,
      startDate: data.startDate,
      endDate: data.endDate,
      seatCount: 4,
      bedCount: 2,
      size: "6m×2.3m×3.2m",
      category: "C型房车",
      facilities: data.includedServices || ["空调", "冰箱", "厨房", "卫浴"],
      includedServices: data.includedServices || ["基础保险", "24小时道路救援"],
      notice: data.description,
      images: data.images || ["https://picsum.photos/800/600?random=7"],
    };
  } else {
    // 普通房车数据适配
    return {
      name: data.modelName || data.name,
      tags: ["热门", "推荐"],
      price: data.dailyPrice,
      rating: "4.8",
      reviewCount: 0,
      seatCount: data.seatCount,
      bedCount: data.bedCount,
      size: `${data.length}m×${data.width}m×${data.height}m`,
      category: data.category,
      facilities: data.facilities || ["空调", "冰箱", "厨房", "卫浴"],
      includedServices: ["基础保险", "24小时道路救援", "免费WiFi"],
      notice: data.description,
      images: data.images || ["https://picsum.photos/800/600?random=7"],
    };
  }
};

/**
 * 预览图片
 */
const previewImage = (index: number) => {
  uni.previewImage({
    urls: vehicleData.value.images,
    current: index,
  });
};

/**
 * 收藏/取消收藏
 */
const handleCollect = async () => {
  try {
    if (isCollected.value) {
      await uncollectVehicle(id.value);
      isCollected.value = false;
      uni.showToast({
        title: "已取消收藏",
        icon: "success",
      });
    } else {
      await collectVehicle(id.value);
      isCollected.value = true;
      uni.showToast({
        title: "收藏成功",
        icon: "success",
      });
    }
  } catch (error) {
    console.error("收藏操作失败:", error);
    uni.showToast({
      title: "操作失败",
      icon: "none",
    });
  }
};

/**
 * 分享
 */
const handleShare = () => {
  uni.showToast({
    title: "分享功能开发中",
    icon: "none",
  });
};

/**
 * 立即预订
 */
const handleBook = () => {
  // 跳转到订单确认页
  uni.navigateTo({
    url: `/pages/order-confirm/index?biz=${biz.value}&id=${id.value}`,
  });
};

/**
 * 查看全部评价
 */
const viewAllReviews = () => {
  uni.showToast({
    title: "评价列表开发中",
    icon: "none",
  });
};
</script>

<style lang="scss" scoped>
.vehicle-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx; /* 底部操作栏高度 */
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid rgba(255, 159, 41, 0.2);
  border-top-color: #ff9f29;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 32rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999;
}

.retry-button {
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 28rpx;
}

/* 详情内容 */
.detail-content {
  background-color: #f5f5f5;
}

/* 图片轮播 */
.image-swiper {
  width: 100%;
  height: 500rpx;
  background-color: #000;
}

.swiper {
  width: 100%;
  height: 100%;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

/* 基本信息区域 */
.info-section {
  background-color: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.title-row {
  margin-bottom: 24rpx;
}

.vehicle-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.tags {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.tag {
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%);
  color: #ff6b35;
  font-size: 22rpx;
  border-radius: 8rpx;
}

.price-rating-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-box {
  flex: 1;
}

.price-label {
  font-size: 24rpx;
  color: #999;
}

.price-row {
  display: flex;
  align-items: baseline;
  margin-top: 8rpx;
}

.price-symbol {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: 600;
}

.price-value {
  font-size: 48rpx;
  color: #ff6b35;
  font-weight: 700;
  line-height: 1;
}

.price-unit {
  font-size: 24rpx;
  color: #ff6b35;
  margin-left: 8rpx;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-top: 8rpx;
}

.rating-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rating-score {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: 600;
}

.rating-count {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 套餐信息区域 */
.package-section,
.params-section,
.facilities-section,
.services-section,
.notice-section,
.reviews-section {
  background-color: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.package-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 车辆参数 */
.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.param-label {
  font-size: 24rpx;
  color: #999;
}

.param-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 配置清单 */
.facilities-list,
.services-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.facility-item,
.service-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.facility-icon,
.service-icon {
  font-size: 24rpx;
  color: #ff6b35;
}

.facility-name,
.service-name {
  font-size: 28rpx;
  color: #333;
}

/* 重要提示 */
.notice-content {
  padding: 24rpx;
  background-color: #fff5f0;
  border-radius: 12rpx;
  border-left: 4rpx solid #ff6b35;
}

.notice-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 用户评价 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.view-all {
  font-size: 26rpx;
  color: #999;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.review-item {
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.review-date {
  font-size: 22rpx;
  color: #999;
}

.review-rating {
  padding: 4rpx 12rpx;
  background-color: #ff6b35;
  color: #fff;
  font-size: 22rpx;
  border-radius: 8rpx;
}

.rating-text {
  font-weight: 600;
}

.review-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.empty-reviews {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 24rpx;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.icon {
  font-size: 40rpx;
}

.button-text {
  font-size: 22rpx;
  color: #666;
}

.book-button {
  flex: 1;
  height: 72rpx;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
}
</style>
