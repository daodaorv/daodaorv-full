<template>
  <view class="store-picker" v-if="visible">
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

      <!-- 门店列表 -->
      <scroll-view class="store-list" scroll-y>
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-state">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="stores.length === 0" class="empty-state">
          <text class="empty-icon">🏪</text>
          <text class="empty-text">该城市暂无可用门店</text>
          <text class="empty-hint">请选择其他城市</text>
        </view>

        <!-- 门店列表 -->
        <view v-else>
          <view
            v-for="store in stores"
            :key="store.id"
            class="store-item"
            :class="{ active: selectedStoreId === store.id }"
            @click="handleSelectStore(store)"
          >
            <view class="store-main">
              <view class="store-name-row">
                <text class="store-name">{{ store.name }}</text>
                <text v-if="store.isDefault" class="store-badge">推荐</text>
              </view>
              <text class="store-address">{{ store.address }}</text>
              <view class="store-info">
                <text class="info-item">⏰ {{ store.businessHours }}</text>
                <text v-if="store.phone" class="info-item">📞 {{ store.phone }}</text>
              </view>
            </view>
            <text v-if="selectedStoreId === store.id" class="store-check">✓</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Store } from "@/types/booking";

interface Props {
  visible: boolean;
  modelValue: string; // 选中的门店ID
  stores: Store[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  "update:modelValue": [storeId: string];
  confirm: [store: Store];
}>();

// 状态
const selectedStoreId = ref(props.modelValue);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedStoreId.value = newValue;
  }
);

// 选择门店
const handleSelectStore = (store: Store) => {
  selectedStoreId.value = store.id;
};

// 确认选择
const handleConfirm = () => {
  const selectedStore = props.stores.find(
    (store) => store.id === selectedStoreId.value
  );
  if (selectedStore) {
    emit("update:modelValue", selectedStore.id);
    emit("confirm", selectedStore);
  }
  handleClose();
};

// 关闭选择器
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.store-picker {
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

/* 门店列表 */
.store-list {
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
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

/* 门店项 */
.store-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s;
}

.store-item:active {
  background: #f7f8fa;
}

.store-item.active {
  background: rgba(255, 159, 41, 0.05);
}

.store-main {
  flex: 1;
  min-width: 0;
}

.store-name-row {
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

.store-item.active .store-name {
  color: #ff9f29;
}

.store-badge {
  padding: 4rpx 12rpx;
  background: rgba(255, 159, 41, 0.1);
  color: #ff9f29;
  font-size: 20rpx;
  border-radius: 4rpx;
}

.store-address {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
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

.store-check {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 32rpx;
  color: #ff9f29;
  font-weight: bold;
}
</style>

