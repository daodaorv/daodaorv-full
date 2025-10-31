<template>
  <view class="city-picker" v-if="visible">
    <!-- 遮罩层 -->
    <view class="picker-mask" @click="handleClose"></view>

    <!-- 选择器内容 -->
    <view class="picker-content">
      <!-- 头部 -->
      <view class="picker-header">
        <text class="header-cancel" @click="handleClose">取消</text>
        <text class="header-title">选择城市</text>
        <text class="header-confirm" @click="handleConfirm">确定</text>
      </view>

      <!-- 搜索框 -->
      <view class="search-box" v-if="showSearch">
        <input
          class="search-input"
          type="text"
          placeholder="搜索城市"
          v-model="searchKeyword"
          @input="handleSearch"
        />
      </view>

      <!-- 城市列表 -->
      <scroll-view class="city-list" scroll-y>
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-state">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="displayCities.length === 0" class="empty-state">
          <text class="empty-icon">🏙️</text>
          <text class="empty-text">{{
            searchKeyword ? "未找到相关城市" : "暂无可用城市"
          }}</text>
        </view>

        <!-- 城市列表 -->
        <view v-else>
          <!-- 热门城市 -->
          <view v-if="!searchKeyword && hotCities.length > 0" class="hot-section">
            <view class="section-title">热门城市</view>
            <view class="hot-cities">
              <view
                v-for="city in hotCities"
                :key="city.id"
                class="hot-city-item"
                :class="{ active: selectedCityId === city.id }"
                @click="handleSelectCity(city)"
              >
                {{ city.name }}
              </view>
            </view>
          </view>

          <!-- 全部城市 -->
          <view class="all-section">
            <view class="section-title" v-if="!searchKeyword">全部城市</view>
            <view
              v-for="city in displayCities"
              :key="city.id"
              class="city-item"
              :class="{ active: selectedCityId === city.id }"
              @click="handleSelectCity(city)"
            >
              <text class="city-name">{{ city.name }}</text>
              <text v-if="selectedCityId === city.id" class="city-check">✓</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { City } from "@/types/booking";

interface Props {
  visible: boolean;
  modelValue: string; // 选中的城市ID
  cities: City[];
  hotCities?: City[];
  showSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hotCities: () => [],
  showSearch: true,
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  "update:modelValue": [cityId: string];
  confirm: [city: City];
}>();

// 状态
const loading = ref(false);
const searchKeyword = ref("");
const selectedCityId = ref(props.modelValue);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedCityId.value = newValue;
  }
);

// 过滤后的城市列表
const displayCities = computed(() => {
  if (!searchKeyword.value) {
    return props.cities;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return props.cities.filter(
    (city) =>
      city.name.toLowerCase().includes(keyword) ||
      city.pinyin?.toLowerCase().includes(keyword)
  );
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
};

// 选择城市
const handleSelectCity = (city: City) => {
  selectedCityId.value = city.id;
};

// 确认选择
const handleConfirm = () => {
  const selectedCity = props.cities.find(
    (city) => city.id === selectedCityId.value
  );
  if (selectedCity) {
    emit("update:modelValue", selectedCity.id);
    emit("confirm", selectedCity);
  }
  handleClose();
};

// 关闭选择器
const handleClose = () => {
  emit("update:visible", false);
  // 重置搜索
  searchKeyword.value = "";
};
</script>

<style scoped>
.city-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.picker-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 头部 */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-cancel,
.header-confirm {
  font-size: 28rpx;
  color: #666;
}

.header-confirm {
  color: #ff9f29;
  font-weight: 600;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

/* 搜索框 */
.search-box {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-input {
  width: 100%;
  height: 72rpx;
  background: #f7f8fa;
  border-radius: 36rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
}

/* 城市列表 */
.city-list {
  flex: 1;
  overflow-y: auto;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
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
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 热门城市 */
.hot-section {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.hot-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.hot-city-item {
  padding: 16rpx 32rpx;
  background: #f7f8fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.7);
  transition: all 0.3s;
}

.hot-city-item.active {
  background: rgba(255, 159, 41, 0.1);
  color: #ff9f29;
  font-weight: 600;
}

/* 全部城市 */
.all-section {
  padding: 24rpx 0;
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  transition: background 0.2s;
}

.city-item:active {
  background: #f7f8fa;
}

.city-name {
  font-size: 30rpx;
  color: rgba(0, 0, 0, 0.9);
}

.city-item.active .city-name {
  color: #ff9f29;
  font-weight: 600;
}

.city-check {
  font-size: 32rpx;
  color: #ff9f29;
  font-weight: bold;
}
</style>

