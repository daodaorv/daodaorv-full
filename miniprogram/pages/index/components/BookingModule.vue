<template>
  <view class="booking-module">
    <view class="module-title">
      <text class="title-icon">🚗</text>
      <text class="title-text">房车预订</text>
    </view>

    <!-- 取还车地点卡片 -->
    <view class="location-card">
      <!-- 取车城市 -->
      <view class="location-row" @click="handleLocationSelect">
        <text class="location-icon">📍</text>
        <view class="location-content">
          <view class="location-main">
            <text class="city-text">{{ pickupCityName }}</text>
            <text class="location-divider">·</text>
            <text class="store-text" @click.stop="handlePickupStoreSelect">
              {{ pickupStoreName }}
            </text>
          </view>
          <text class="location-hint">取车地点</text>
        </view>
        <text class="location-arrow">›</text>
      </view>

      <!-- 异地还车开关 -->
      <view class="remote-switch">
        <text class="switch-label">异地还车</text>
        <switch
          :checked="differentReturn"
          @change="handleDifferentReturnChange"
          color="#FF9F29"
          class="switch-toggle"
        />
      </view>

      <!-- 异地还车地点(开启时显示) -->
      <view v-if="differentReturn" class="remote-return-section">
        <view class="location-divider-line"></view>
        <view class="location-row" @click="handleReturnLocationSelect">
          <text class="location-icon">📍</text>
          <view class="location-content">
            <view class="location-main">
              <text class="city-text">{{ returnCityName }}</text>
              <text class="location-divider">·</text>
              <text class="store-text" @click.stop="handleReturnStoreSelect">
                {{ returnStoreName }}
              </text>
            </view>
            <text class="location-hint">还车地点</text>
          </view>
          <text class="location-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 取还车时间卡片 -->
    <view class="datetime-card">
      <view class="datetime-row">
        <text class="datetime-icon">📅</text>
        <view class="datetime-content">
          <view class="datetime-main">
            <view class="datetime-item" @click="handlePickupTimeSelect">
              <text class="datetime-label">取车</text>
              <text class="datetime-value">{{ formattedPickupTime }}</text>
            </view>
            <view class="datetime-separator">
              <view class="separator-line"></view>
              <text class="rental-days">{{ rentalDays }}天</text>
              <view class="separator-line"></view>
            </view>
            <view class="datetime-item" @click="handleReturnTimeSelect">
              <text class="datetime-label">还车</text>
              <text class="datetime-value">{{ formattedReturnTime }}</text>
            </view>
          </view>
        </view>
        <text class="datetime-arrow">›</text>
      </view>
    </view>

    <!-- 查询按钮 -->
    <button class="search-button" @click="handleSearch" :loading="searching">
      {{ searching ? "查询中..." : "查询可用房车" }}
    </button>

    <!-- 选择器组件 -->
    <!-- 取车地点选择器 -->
    <LocationPicker
      :visible="showPickupLocationPicker"
      :cities="bookingStore.allCities"
      :stores="bookingStore.storesMap"
      :selectedCityId="pickupCityId"
      :selectedStoreId="pickupStoreId"
      @update:visible="showPickupLocationPicker = $event"
      @update:selectedCityId="pickupCityId = $event"
      @update:selectedStoreId="pickupStoreId = $event"
      @load-stores="bookingStore.loadStores"
      @confirm="handlePickupLocationConfirm"
    />

    <!-- 还车地点选择器 -->
    <LocationPicker
      v-if="differentReturn"
      :visible="showReturnLocationPicker"
      :cities="bookingStore.allCities"
      :stores="bookingStore.storesMap"
      :selectedCityId="returnCityId"
      :selectedStoreId="returnStoreId"
      @update:visible="showReturnLocationPicker = $event"
      @update:selectedCityId="returnCityId = $event"
      @update:selectedStoreId="returnStoreId = $event"
      @load-stores="bookingStore.loadStores"
      @confirm="handleReturnLocationConfirm"
    />

    <!-- 日历选择器 -->
    <CalendarPicker
      :visible="showCalendarPicker"
      :pickupTime="pickupTime"
      :returnTime="returnTime"
      :initialMode="timeSelectionMode"
      @update:visible="showCalendarPicker = $event"
      @update:pickupTime="pickupTime = $event"
      @update:returnTime="returnTime = $event"
      @confirm="handleCalendarConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBookingStore } from "@/store/modules/booking";
import type { City, Store, BookingParams } from "@/types/booking";
import dayjs from "dayjs";
import LocationPicker from "@/components/common/LocationPicker.vue";
import CalendarPicker from "@/components/common/CalendarPicker.vue";

const emit = defineEmits<{
  search: [params: BookingParams];
}>();

const bookingStore = useBookingStore();

// ==================== 状态 ====================
// 选中的城市和门店ID
const pickupCityId = ref("");
const pickupStoreId = ref("");
const returnCityId = ref("");
const returnStoreId = ref("");

// 时间
const pickupTime = ref("");
const returnTime = ref("");

// 异地还车
const differentReturn = ref(false);

// 选择器显示状态
const showPickupLocationPicker = ref(false);
const showReturnLocationPicker = ref(false);
const showCalendarPicker = ref(false);
const timeSelectionMode = ref<'pickup' | 'return'>('pickup');

// 加载状态
const searching = ref(false);

// ==================== 计算属性 ====================
// 取车城市名称
const pickupCityName = computed(() => {
  const city = bookingStore.getCityById(pickupCityId.value);
  return city?.name || "请选择";
});

// 取车门店名称
const pickupStoreName = computed(() => {
  const store = bookingStore.getStoreById(
    pickupCityId.value,
    pickupStoreId.value
  );
  return store?.name || "请选择";
});

// 还车城市名称
const returnCityName = computed(() => {
  if (!differentReturn.value) return pickupCityName.value;
  const city = bookingStore.getCityById(returnCityId.value);
  return city?.name || "请选择";
});

// 还车门店名称
const returnStoreName = computed(() => {
  if (!differentReturn.value) return pickupStoreName.value;
  const store = bookingStore.getStoreById(
    returnCityId.value,
    returnStoreId.value
  );
  return store?.name || "请选择";
});

// 取车门店列表
const pickupStores = computed(() => {
  return bookingStore.storesMap[pickupCityId.value] || [];
});

// 还车门店列表
const returnStores = computed(() => {
  return bookingStore.storesMap[returnCityId.value] || [];
});

// 计算租期天数
const rentalDays = computed(() => {
  if (!pickupTime.value || !returnTime.value) return 0;
  const pickup = dayjs(pickupTime.value);
  const returnDate = dayjs(returnTime.value);
  const diff = returnDate.diff(pickup, "hour");
  return Math.ceil(diff / 24);
});

// 格式化时间显示
const formattedPickupTime = computed(() => {
  if (!pickupTime.value) return "请选择";
  return formatDateTime(pickupTime.value);
});

const formattedReturnTime = computed(() => {
  if (!returnTime.value) return "请选择";
  return formatDateTime(returnTime.value);
});

// 格式化日期时间
const formatDateTime = (dateTimeStr: string): string => {
  const date = dayjs(dateTimeStr);
  const month = date.format("MM");
  const day = date.format("DD");
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekDay = weekDays[date.day()];
  const time = date.format("HH:mm");
  return `${month}-${day} 周${weekDay} ${time}`;
};

// ==================== 初始化 ====================
onMounted(async () => {
  // 加载城市列表
  await bookingStore.loadCities();

  // 读取用户上次选择
  const lastRecord = bookingStore.loadRecord();

  if (lastRecord) {
    // 使用历史记录
    pickupCityId.value = lastRecord.pickupCityId;
    pickupStoreId.value = lastRecord.pickupStoreId;
    differentReturn.value = lastRecord.differentReturn;

    // 加载门店列表
    await bookingStore.loadStores(pickupCityId.value);
  } else {
    // 使用默认值:深圳
    const defaultCity = bookingStore.allCities.find((c) => c.name === "深圳");
    if (defaultCity) {
      pickupCityId.value = defaultCity.id;
      await bookingStore.loadStores(defaultCity.id);
      const defaultStore = bookingStore.getDefaultStore(defaultCity.id);
      if (defaultStore) {
        pickupStoreId.value = defaultStore.id;
      }
    }
  }

  // 设置默认时间
  initDefaultTime();
});

// 初始化默认时间
const initDefaultTime = () => {
  // 取车时间:当前时间+4小时,取整点
  const now = dayjs();
  const pickupDate = now.add(4, "hour");
  const roundedPickup = pickupDate.minute(0).second(0).millisecond(0);
  pickupTime.value = roundedPickup.toISOString();

  // 还车时间:取车时间+2天,时间点同步
  const returnDate = roundedPickup.add(2, "day");
  returnTime.value = returnDate.toISOString();
};

// ==================== 事件处理 ====================
// 选择取车地点
const handleLocationSelect = () => {
  showPickupLocationPicker.value = true;
};

// 确认取车地点
const handlePickupLocationConfirm = (result: any) => {
  pickupCityId.value = result.cityId;
  pickupStoreId.value = result.storeId;
};

// 选择还车地点
const handleReturnLocationSelect = () => {
  showReturnLocationPicker.value = true;
};

// 确认还车地点
const handleReturnLocationConfirm = (result: any) => {
  returnCityId.value = result.cityId;
  returnStoreId.value = result.storeId;
};

// 选择时间
const handlePickupTimeSelect = () => {
  timeSelectionMode.value = 'pickup';
  showCalendarPicker.value = true;
};

const handleReturnTimeSelect = () => {
  timeSelectionMode.value = 'return';
  showCalendarPicker.value = true;
};

// 确认日历选择
const handleCalendarConfirm = (result: {
  pickupTime: string;
  returnTime: string;
}) => {
  pickupTime.value = result.pickupTime;
  returnTime.value = result.returnTime;
};

// 异地还车开关
const handleDifferentReturnChange = (e: any) => {
  differentReturn.value = e.detail.value;

  if (differentReturn.value) {
    // 开启异地还车,默认还车地点与取车地点相同
    returnCityId.value = pickupCityId.value;
    returnStoreId.value = pickupStoreId.value;

    uni.showToast({
      title: "已开启异地还车,需支付额外费用",
      icon: "none",
      duration: 2000,
    });
  }
};

// 查询可用房车
const handleSearch = async () => {
  // 验证必填字段
  if (!pickupCityId.value || !pickupStoreId.value) {
    uni.showToast({ title: "请选择取车地点", icon: "none" });
    return;
  }

  if (!pickupTime.value || !returnTime.value) {
    uni.showToast({ title: "请选择取还车时间", icon: "none" });
    return;
  }

  if (differentReturn.value && (!returnCityId.value || !returnStoreId.value)) {
    uni.showToast({ title: "请选择还车地点", icon: "none" });
    return;
  }

  // 验证时间逻辑
  const pickup = dayjs(pickupTime.value);
  const returnDate = dayjs(returnTime.value);
  const now = dayjs();

  // 验证取车时间最早为当前时间+4小时
  const minPickupTime = now.add(4, "hour");
  if (pickup.isBefore(minPickupTime)) {
    uni.showToast({
      title: "取车时间最早为当前时间4小时后",
      icon: "none",
      duration: 3000
    });
    return;
  }

  // 验证取车时间最晚为当前时间+6个月
  const maxPickupTime = now.add(6, "month");
  if (pickup.isAfter(maxPickupTime)) {
    uni.showToast({
      title: "取车时间最晚为当前时间6个月内",
      icon: "none",
      duration: 3000
    });
    return;
  }

  // 验证还车时间必须晚于取车时间
  if (returnDate.isBefore(pickup) || returnDate.isSame(pickup)) {
    uni.showToast({ title: "还车时间必须晚于取车时间", icon: "none" });
    return;
  }

  // 验证取还车时间点必须相同
  const pickupHour = pickup.hour();
  const returnHour = returnDate.hour();
  if (pickupHour !== returnHour) {
    uni.showToast({
      title: "取还车时间点必须相同",
      icon: "none",
      duration: 3000
    });
    return;
  }

  // 验证最短租赁时长为2天（48小时）
  const hoursDiff = returnDate.diff(pickup, "hour");
  if (hoursDiff < 48) {
    uni.showToast({
      title: "租赁时长至少2天（48小时）",
      icon: "none",
      duration: 3000
    });
    return;
  }

  // 验证最长租赁时长为60天
  const days = hoursDiff / 24;
  if (days > 60) {
    uni.showToast({
      title: "租赁时长最长60天",
      icon: "none",
      duration: 3000
    });
    return;
  }

  // 保存用户选择
  bookingStore.saveRecord({
    pickupCityId: pickupCityId.value,
    pickupCityName: pickupCityName.value,
    pickupStoreId: pickupStoreId.value,
    pickupStoreName: pickupStoreName.value,
    differentReturn: differentReturn.value,
    timestamp: Date.now(),
  });

  // 构建查询参数
  const params: BookingParams = {
    pickupCityId: pickupCityId.value,
    pickupCityName: pickupCityName.value,
    pickupStoreId: pickupStoreId.value,
    pickupStoreName: pickupStoreName.value,
    returnCityId: differentReturn.value
      ? returnCityId.value
      : pickupCityId.value,
    returnCityName: differentReturn.value
      ? returnCityName.value
      : pickupCityName.value,
    returnStoreId: differentReturn.value
      ? returnStoreId.value
      : pickupStoreId.value,
    returnStoreName: differentReturn.value
      ? returnStoreName.value
      : pickupStoreName.value,
    pickupTime: pickupTime.value,
    returnTime: returnTime.value,
    differentReturn: differentReturn.value,
    rentalDays: rentalDays.value,
  };

  // 发送查询事件
  emit("search", params);

  // 跳转到车辆列表页
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  uni.navigateTo({
    url: `/pages/vehicle-list/index?${queryString}`,
  });
};
</script>

<style scoped>
.booking-module {
  background: #ffffff;
  margin: 24rpx 32rpx;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.module-title {
  font-size: 36rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.title-icon {
  font-size: 36rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

/* 地点卡片 */
.location-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.location-card:hover {
  box-shadow: 0 4rpx 20rpx rgba(255, 159, 41, 0.15);
}

.location-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  cursor: pointer;
  padding: 16rpx;
  margin: -16rpx;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.location-row:active {
  background: rgba(255, 159, 41, 0.05);
}

.location-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.location-content {
  flex: 1;
  min-width: 0;
}

.location-main {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 6rpx;
}

.city-text {
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.location-divider {
  color: rgba(0, 0, 0, 0.3);
  font-size: 24rpx;
}

.store-text {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-hint {
  font-size: 24rpx;
  color: rgba(0, 0, 0, 0.5);
}

.location-arrow {
  font-size: 36rpx;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

/* 异地还车开关 */
.remote-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  margin-top: 16rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);
}

.switch-label {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.9);
}

.switch-toggle {
  transform: scale(0.9);
}

.location-divider-line {
  height: 1rpx;
  background: rgba(0, 0, 0, 0.08);
  margin: 16rpx 0;
}

.remote-return-section {
  margin-top: 16rpx;
}

/* 时间卡片 */
.datetime-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.datetime-card:active {
  box-shadow: 0 4rpx 20rpx rgba(255, 159, 41, 0.15);
  transform: translateY(-2rpx);
}

.datetime-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.datetime-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.datetime-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.datetime-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.datetime-item {
  flex: 1;
  min-width: 0;
}

.datetime-label {
  font-size: 22rpx;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4rpx;
  display: block;
}

.datetime-value {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.datetime-separator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.separator-line {
  width: 1rpx;
  height: 16rpx;
  background: rgba(0, 0, 0, 0.15);
}

.rental-days {
  font-size: 20rpx;
  font-weight: 600;
  color: #ff9f29;
  white-space: nowrap;
}

.datetime-arrow {
  font-size: 32rpx;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

/* 查询按钮 */
.search-button {
  width: 100%;
  background: linear-gradient(135deg, #ff9f29 0%, #ffb347 100%);
  color: #ffffff;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(255, 159, 41, 0.3);
  transition: all 0.3s;
  text-align: center;
}

.search-button::after {
  border: none;
}

.search-button:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(255, 159, 41, 0.4);
}
</style>
