<template>
  <view class="location-picker" v-if="visible">
    <!-- 遮罩层 -->
    <view class="picker-mask" @click="handleClose"></view>

    <!-- 选择器内容 -->
    <view class="picker-content">
      <!-- 头部 -->
      <view class="picker-header">
        <text class="header-cancel" @click="handleClose">取消</text>
        <text class="header-title">选择门店</text>
        <text class="header-confirm" @click="handleConfirm">确定</text>
      </view>

      <!-- 主体:左右分栏 -->
      <view class="picker-body">
        <!-- 左侧:城市列表 -->
        <scroll-view class="city-column" scroll-y>
          <view
            v-for="city in cities"
            :key="city.id"
            class="city-item"
            :class="{ active: currentCityId === city.id }"
            @click="handleSelectCity(city)"
          >
            <text class="city-name">{{ city.name }}</text>
            <view
              v-if="currentCityId === city.id"
              class="city-indicator"
            ></view>
          </view>

          <!-- 加载状态 -->
          <view v-if="cities.length === 0" class="empty-state">
            <text class="empty-text">加载中...</text>
          </view>
        </scroll-view>

        <!-- 右侧:门店列表 -->
        <scroll-view class="store-column" scroll-y>
          <!-- 加载中 -->
          <view v-if="storeLoading" class="loading-state">
            <view class="loading-spinner"></view>
            <text class="loading-text">加载门店中...</text>
          </view>

          <!-- 门店列表 -->
          <view v-else-if="currentStores.length > 0" class="store-list">
            <view
              v-for="store in currentStores"
              :key="store.id"
              class="store-item"
              :class="{ selected: currentStoreId === store.id }"
              @click="handleSelectStore(store)"
            >
              <view class="store-main">
                <view class="store-header">
                  <text class="store-name">{{ store.name }}</text>
                  <text v-if="store.isDefault" class="store-badge">推荐</text>
                </view>
                <text class="store-address">{{ store.address }}</text>
                <view class="store-info">
                  <text class="info-item">⏰ {{ store.businessHours }}</text>
                </view>
                <text v-if="store.phone" class="store-phone"
                  >📞 {{ store.phone }}</text
                >
              </view>
              <view v-if="currentStoreId === store.id" class="store-check"
                >✓</view
              >
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else class="empty-state">
            <text class="empty-icon">🏪</text>
            <text class="empty-text">该城市暂无门店</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { City, Store } from "@/types/booking";

interface Props {
  visible: boolean;
  cities: City[];
  stores: Record<string, Store[]>; // cityId -> stores
  selectedCityId?: string;
  selectedStoreId?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedCityId: "",
  selectedStoreId: "",
  loading: false,
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  "update:selectedCityId": [cityId: string];
  "update:selectedStoreId": [storeId: string];
  confirm: [
    result: { cityId: string; storeId: string; city: City; store: Store }
  ];
  "load-stores": [cityId: string];
}>();

// 当前选中的城市和门店
const currentCityId = ref("");
const currentStoreId = ref("");
const storeLoading = ref(false);

// 当前城市的门店列表
const currentStores = computed(() => {
  if (!currentCityId.value) return [];
  return props.stores[currentCityId.value] || [];
});

// 监听 visible 变化,打开时初始化
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      currentCityId.value = props.selectedCityId || (props.cities[0]?.id ?? "");
      currentStoreId.value = props.selectedStoreId || "";

      // 如果有选中的城市但没有门店数据,加载门店
      if (currentCityId.value && !props.stores[currentCityId.value]) {
        loadStores(currentCityId.value);
      }
    }
  },
  { immediate: true }
);

// 选择城市
const handleSelectCity = (city: City) => {
  currentCityId.value = city.id;
  currentStoreId.value = ""; // 切换城市时清空门店选择

  // 如果该城市没有门店数据,触发加载
  if (!props.stores[city.id]) {
    loadStores(city.id);
  } else {
    // 自动选择默认门店
    const defaultStore = currentStores.value.find((s) => s.isDefault);
    if (defaultStore) {
      currentStoreId.value = defaultStore.id;
    } else if (currentStores.value.length > 0) {
      currentStoreId.value = currentStores.value[0].id;
    }
  }
};

// 加载门店
const loadStores = async (cityId: string) => {
  storeLoading.value = true;
  emit("load-stores", cityId);

  // 等待父组件加载完成
  setTimeout(() => {
    storeLoading.value = false;

    // 自动选择默认门店
    const stores = props.stores[cityId] || [];
    const defaultStore = stores.find((s) => s.isDefault);
    if (defaultStore) {
      currentStoreId.value = defaultStore.id;
    } else if (stores.length > 0) {
      currentStoreId.value = stores[0].id;
    }
  }, 500);
};

// 选择门店
const handleSelectStore = (store: Store) => {
  currentStoreId.value = store.id;
};

// 确认选择
const handleConfirm = () => {
  if (!currentCityId.value || !currentStoreId.value) {
    uni.showToast({
      title: "请选择门店",
      icon: "none",
    });
    return;
  }

  const city = props.cities.find((c) => c.id === currentCityId.value);
  const store = currentStores.value.find((s) => s.id === currentStoreId.value);

  if (!city || !store) {
    uni.showToast({
      title: "选择的门店不存在",
      icon: "none",
    });
    return;
  }

  emit("update:selectedCityId", currentCityId.value);
  emit("update:selectedStoreId", currentStoreId.value);
  emit("confirm", {
    cityId: currentCityId.value,
    storeId: currentStoreId.value,
    city,
    store,
  });

  handleClose();
};

// 关闭选择器
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.location-picker {
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 头部 */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #ffffff;
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

/* 主体:左右分栏 */
.picker-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧:城市列表 */
.city-column {
  width: 200rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.city-item {
  position: relative;
  padding: 28rpx 24rpx;
  background: #f5f5f5;
  border-bottom: 1rpx solid #e5e5e5;
  transition: all 0.3s;
}

.city-item.active {
  background: #ffffff;
  font-weight: 600;
}

.city-name {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.9);
}

.city-item.active .city-name {
  color: #ff9f29;
}

.city-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 32rpx;
  background: #ff9f29;
  border-radius: 0 4rpx 4rpx 0;
}

/* 右侧:门店列表 */
.store-column {
  flex: 1;
  background: #ffffff;
  padding: 16rpx;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #ff9f29;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

/* 门店列表 */
.store-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.store-item {
  position: relative;
  background: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  border: 2rpx solid #f0f0f0;
  transition: all 0.3s;
}

.store-item.selected {
  border-color: #ff9f29;
  background: rgba(255, 159, 41, 0.05);
}

.store-main {
  flex: 1;
  min-width: 0;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.store-name {
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.store-badge {
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, #ff9f29 0%, #ffb347 100%);
  color: #ffffff;
  font-size: 20rpx;
  border-radius: 4rpx;
}

.store-address {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: block;
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item {
  font-size: 24rpx;
  color: #999;
}

.store-phone {
  font-size: 24rpx;
  color: #ff9f29;
  margin-top: 8rpx;
  display: block;
}

.store-check {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff9f29;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}
</style>
