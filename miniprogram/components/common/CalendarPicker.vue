<template>
  <view class="calendar-picker" v-if="visible">
    <!-- 遮罩层 -->
    <view class="picker-mask" @click="handleClose"></view>

    <!-- 选择器内容 -->
    <view class="picker-content">
      <!-- 头部 -->
      <view class="picker-header">
        <text class="header-title">租车时间</text>
        <text class="header-close" @click="handleClose">✕</text>
      </view>

      <!-- 取还车时间显示 -->
      <view class="time-display">
        <view
          class="time-item"
          :class="{ active: mode === 'pickup' }"
          @click="switchMode('pickup')"
        >
          <text class="time-label">取车</text>
          <text class="time-value">{{ formattedPickupTime }}</text>
        </view>
        <view class="time-separator">
          <text v-if="rentalDays > 0" class="rental-days"
            >{{ rentalDays }}天</text
          >
          <text v-else class="rental-hint">→</text>
        </view>
        <view
          class="time-item"
          :class="{ active: mode === 'return' }"
          @click="switchMode('return')"
        >
          <text class="time-label">还车</text>
          <text class="time-value">{{ formattedReturnTime }}</text>
        </view>
      </view>

      <!-- 选择提示 -->
      <view class="selection-hint">
        <text v-if="selectionState === 'none'">📅 请选择取车日期</text>
        <text v-else-if="selectionState === 'pickup-selected'"
          >📅 请选择还车日期</text
        >
        <text v-else>✓ 已选择租期,再次点击日期可重新选择</text>
      </view>

      <!-- 日历主体 -->
      <scroll-view class="calendar-body" scroll-y>
        <!-- 月份列表 -->
        <view v-for="month in months" :key="month.key" class="month-section">
          <!-- 月份标题 -->
          <view class="month-header">{{ month.title }}</view>

          <!-- 星期标题 -->
          <view class="week-header">
            <text v-for="day in weekDays" :key="day" class="week-day">{{
              day
            }}</text>
          </view>

          <!-- 日期网格 -->
          <view class="date-grid">
            <!-- 空白占位 -->
            <view
              v-for="i in month.startDay"
              :key="`empty-${i}`"
              class="date-cell empty"
            ></view>

            <!-- 日期单元格 -->
            <view
              v-for="date in month.dates"
              :key="date.key"
              class="date-cell"
              :class="{
                disabled: date.disabled,
                selected: date.selected,
                'in-range': date.inRange,
                'range-start': date.rangeStart,
                'range-end': date.rangeEnd,
              }"
              @click="handleSelectDate(date)"
            >
              <text class="date-number">{{ date.day }}</text>
              <text v-if="date.price" class="date-price"
                >¥{{ date.price }}</text
              >
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="picker-footer">
        <view class="time-selector">
          <text class="time-label">时间点</text>
          <picker
            mode="selector"
            :value="selectedHourIndex"
            :range="availableHours"
            @change="handleTimeChange"
          >
            <view class="time-picker-btn">
              <text>{{ selectedTime }}</text>
            </view>
          </picker>
        </view>

        <button class="confirm-btn" @click="handleConfirm">查询可用房车</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";

interface Props {
  visible: boolean;
  pickupTime?: string;
  returnTime?: string;
  initialMode?: 'pickup' | 'return';
}

const props = withDefaults(defineProps<Props>(), {
  pickupTime: "",
  returnTime: "",
  initialMode: 'pickup',
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  "update:pickupTime": [time: string];
  "update:returnTime": [time: string];
  confirm: [result: { pickupTime: string; returnTime: string }];
}>();

// 星期标题
const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 选择状态: 'none' | 'pickup-selected' | 'range-selected'
const selectionState = ref<"none" | "pickup-selected" | "range-selected">(
  "none"
);

// 临时选中的日期和时间
const tempPickupDate = ref("");
const tempReturnDate = ref("");
const selectedTime = ref("10:00"); // 统一的时间选择，取还车时间自动同步

// 门店营业时间配置 (9:00-18:00，整点选择)
const businessHours = {
  start: 9, // 9:00
  end: 18, // 18:00
};

// 可选时间列表（整点）
const availableHours = computed(() => {
  const hours = [];
  for (let i = businessHours.start; i <= businessHours.end; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return hours;
});

// 选中的时间索引
const selectedHourIndex = computed(() => {
  return availableHours.value.indexOf(selectedTime.value);
});

// 确保时间符合营业时间要求
const normalizeTimeToBusinessHours = (timeStr: string): string => {
  const time = dayjs(timeStr);
  const hour = time.hour();

  if (hour < businessHours.start) {
    return `${businessHours.start.toString().padStart(2, '0')}:00`;
  } else if (hour > businessHours.end) {
    return `${businessHours.end.toString().padStart(2, '0')}:00`;
  } else {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
};

// 当前激活的模式(用于UI显示)
const mode = computed(() => {
  if (
    selectionState.value === "none" ||
    selectionState.value === "pickup-selected"
  ) {
    return "pickup";
  }
  return "return";
});

// 初始化
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      // 根据initialMode设置初始状态
      if (props.initialMode === 'return' && props.pickupTime) {
        // 如果是还车模式且已有取车时间，直接设置为还车选择
        const pickup = dayjs(props.pickupTime);
        tempPickupDate.value = pickup.format("YYYY-MM-DD");
        selectedTime.value = normalizeTimeToBusinessHours(pickup.format("HH:mm"));

        if (props.returnTime) {
          const returnDate = dayjs(props.returnTime);
          tempReturnDate.value = returnDate.format("YYYY-MM-DD");
          selectionState.value = "range-selected";
        } else {
          // 默认:取车时间+2天
          const defaultReturn = dayjs(tempPickupDate.value).add(2, "day");
          tempReturnDate.value = defaultReturn.format("YYYY-MM-DD");
          selectionState.value = "pickup-selected"; // 等待选择还车时间
        }
      } else {
        // 默认初始化或取车模式
        if (props.pickupTime) {
          const pickup = dayjs(props.pickupTime);
          tempPickupDate.value = pickup.format("YYYY-MM-DD");
          selectedTime.value = normalizeTimeToBusinessHours(pickup.format("HH:mm"));
          selectionState.value = "pickup-selected";
        } else {
          // 默认:当前时间+4小时，调整为营业时间和整点
          const defaultPickup = dayjs().add(4, "hour").minute(0).second(0);
          tempPickupDate.value = defaultPickup.format("YYYY-MM-DD");
          selectedTime.value = normalizeTimeToBusinessHours(defaultPickup.format("HH:mm"));
          selectionState.value = "pickup-selected";
        }

        // 无论哪种情况，都需要设置还车时间（如果还没有的话）
        if (props.returnTime) {
          const returnDate = dayjs(props.returnTime);
          tempReturnDate.value = returnDate.format("YYYY-MM-DD");
          if (selectionState.value === "pickup-selected") {
            selectionState.value = "range-selected";
          }
        } else if (tempPickupDate.value) {
          // 默认:取车时间+2天
          const defaultReturn = dayjs(tempPickupDate.value).add(2, "day");
          tempReturnDate.value = defaultReturn.format("YYYY-MM-DD");
          if (selectionState.value === "pickup-selected") {
            selectionState.value = "range-selected";
          }
        }
      }
    }
  },
  { immediate: true }
);

// 格式化显示
const formattedPickupTime = computed(() => {
  if (!tempPickupDate.value) return "请选择取车日期";
  const date = dayjs(tempPickupDate.value);
  return `${date.format("MM-DD")} 周${weekDays[date.day()].slice(1)} ${
    selectedTime.value
  }`;
});

const formattedReturnTime = computed(() => {
  if (
    selectionState.value === "none" ||
    selectionState.value === "pickup-selected"
  ) {
    return "请选择还车日期";
  }
  if (!tempReturnDate.value) return "请选择还车日期";
  const date = dayjs(tempReturnDate.value);
  return `${date.format("MM-DD")} 周${weekDays[date.day()].slice(1)} ${
    selectedTime.value
  }`;
});

// 租期天数
const rentalDays = computed(() => {
  if (!tempPickupDate.value || !tempReturnDate.value) return 0;
  const pickup = dayjs(`${tempPickupDate.value} ${selectedTime.value}`);
  const returnDate = dayjs(`${tempReturnDate.value} ${selectedTime.value}`);
  return Math.ceil(returnDate.diff(pickup, "hour") / 24);
});

// 生成月份数据(未来6个月)
const months = computed(() => {
  const result = [];
  const now = dayjs();

  for (let i = 0; i < 6; i++) {
    const monthStart = now.add(i, "month").startOf("month");
    const monthEnd = monthStart.endOf("month");
    const daysInMonth = monthEnd.date();
    const startDay = monthStart.day(); // 0-6,周日为0

    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = monthStart.date(day);
      const dateStr = currentDate.format("YYYY-MM-DD");

      // 判断是否禁用(取车时间最早为当前时间+4小时)
      const minPickupTime = now.add(4, "hour");
      const isDisabled = currentDate.isBefore(minPickupTime, "day");

      // 判断是否选中
      const isPickupDate = dateStr === tempPickupDate.value;
      const isReturnDate = dateStr === tempReturnDate.value;
      const isSelected = isPickupDate || isReturnDate;

      // 判断是否在范围内
      const pickup = dayjs(tempPickupDate.value);
      const returnDate = dayjs(tempReturnDate.value);
      const isInRange =
        tempPickupDate.value &&
        tempReturnDate.value &&
        currentDate.isAfter(pickup, "day") &&
        currentDate.isBefore(returnDate, "day");

      dates.push({
        key: dateStr,
        day,
        date: currentDate,
        dateStr,
        disabled: isDisabled,
        selected: isSelected,
        inRange: isInRange,
        rangeStart: isPickupDate,
        rangeEnd: isReturnDate,
        price: isDisabled ? null : Math.floor(Math.random() * 200) + 500, // Mock价格
      });
    }

    result.push({
      key: monthStart.format("YYYY-MM"),
      title: monthStart.format("YYYY年MM月"),
      startDay,
      dates,
    });
  }

  return result;
});

// 切换模式(点击顶部取车/还车切换)
const switchMode = (newMode: "pickup" | "return") => {
  if (newMode === "pickup") {
    // 切换到取车模式,准备重新选择
    selectionState.value = "none";
    tempPickupDate.value = "";
    tempReturnDate.value = "";
  } else if (newMode === "return") {
    // 切换到还车模式
    if (tempPickupDate.value) {
      // 如果已选择取车日期，设置为还车选择状态
      selectionState.value = "pickup-selected";
    }
    // 如果还没有选择取车日期，不处理（需要先选择取车日期）
  }
};

// 选择日期 - 三次点击循环逻辑
const handleSelectDate = (date: any) => {
  if (date.disabled) return;

  const selectedDate = dayjs(date.dateStr);

  // 状态机:none -> pickup-selected -> range-selected -> none
  switch (selectionState.value) {
    case "none":
      // 第一次点击:选择取车日期
      tempPickupDate.value = date.dateStr;
      tempReturnDate.value = ""; // 清空还车日期
      selectionState.value = "pickup-selected";
      break;

    case "pickup-selected":
      // 第二次点击:选择还车日期
      const pickup = dayjs(tempPickupDate.value);

      // 验证:还车日期必须晚于取车日期
      if (
        selectedDate.isBefore(pickup, "day") ||
        selectedDate.isSame(pickup, "day")
      ) {
        // 如果点击的日期早于或等于取车日期,重新选择取车日期
        tempPickupDate.value = date.dateStr;
        tempReturnDate.value = "";
        selectionState.value = "pickup-selected";
        return;
      }

      // 验证:租期至少2天
      if (selectedDate.diff(pickup, "day") < 2) {
        uni.showToast({
          title: "租赁时长至少2天",
          icon: "none",
        });
        return;
      }

      // 验证:租期最长60天
      if (selectedDate.diff(pickup, "day") > 60) {
        uni.showToast({
          title: "租赁时长最长60天",
          icon: "none",
        });
        return;
      }

      // 设置还车日期
      tempReturnDate.value = date.dateStr;
      selectionState.value = "range-selected";
      break;

    case "range-selected":
      // 第三次点击:取消选择,重新开始
      tempPickupDate.value = date.dateStr;
      tempReturnDate.value = "";
      selectionState.value = "pickup-selected";
      break;
  }
};

// 修改时间
const handleTimeChange = (e: any) => {
  const selectedIndex = e.detail.value;
  selectedTime.value = availableHours.value[selectedIndex];
};

// 确认
const handleConfirm = () => {
  // 验证日期和时间是否已选择
  if (!tempPickupDate.value || !tempReturnDate.value) {
    uni.showToast({
      title: "请选择取还车日期",
      icon: "none",
    });
    return;
  }

  if (!selectedTime.value) {
    uni.showToast({
      title: "请选择时间点",
      icon: "none",
    });
    return;
  }

  // 验证日期格式是否有效 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(tempPickupDate.value) || !dateRegex.test(tempReturnDate.value)) {
    uni.showToast({
      title: "日期格式无效",
      icon: "none",
    });
    return;
  }

  // 验证时间格式是否有效 (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(selectedTime.value)) {
    uni.showToast({
      title: "时间格式无效",
      icon: "none",
    });
    return;
  }

  // 构造并验证日期时间对象
  const pickupDateTimeStr = `${tempPickupDate.value} ${selectedTime.value}`;
  const returnDateTimeStr = `${tempReturnDate.value} ${selectedTime.value}`;

  const pickupDateTime = dayjs(pickupDateTimeStr);
  const returnDateTime = dayjs(returnDateTimeStr);

  if (!pickupDateTime.isValid()) {
    uni.showToast({
      title: "取车时间无效",
      icon: "none",
    });
    return;
  }

  if (!returnDateTime.isValid()) {
    uni.showToast({
      title: "还车时间无效",
      icon: "none",
    });
    return;
  }

  const pickupTime = pickupDateTime.toISOString();
  const returnTime = returnDateTime.toISOString();

  emit("update:pickupTime", pickupTime);
  emit("update:returnTime", returnTime);
  emit("confirm", { pickupTime, returnTime });

  handleClose();
};

// 关闭
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.calendar-picker {
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
  max-height: 90vh;
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

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.header-close {
  font-size: 36rpx;
  color: #999;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 时间显示 */
.time-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #f8f8f8;
}

.time-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.time-item.active {
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.time-label {
  font-size: 24rpx;
  color: #999;
}

.time-item.active .time-label {
  color: #ff9f29;
}

.time-value {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.time-separator {
  padding: 0 16rpx;
}

.rental-days {
  font-size: 20rpx;
  font-weight: 600;
  color: #ff9f29;
}

.rental-hint {
  font-size: 24rpx;
  color: #ccc;
}

/* 选择提示 */
.selection-hint {
  padding: 16rpx 32rpx;
  text-align: center;
  background: #fffbf5;
  border-bottom: 1rpx solid #f0f0f0;
}

.selection-hint text {
  font-size: 24rpx;
  color: #ff9f29;
}

/* 日历主体 */
.calendar-body {
  flex: 1;
  overflow-y: auto;
}

.month-section {
  padding: 24rpx 32rpx;
}

.month-header {
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 16rpx;
}

/* 星期标题 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.week-day {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 0;
}

/* 日期网格 */
.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.date-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  position: relative;
  transition: all 0.3s;
}

.date-cell.empty {
  background: transparent;
}

.date-cell.disabled {
  opacity: 0.3;
  pointer-events: none;
}

.date-cell.selected {
  background: #ff9f29;
  color: #ffffff;
}

.date-cell.in-range {
  background: rgba(255, 159, 41, 0.1);
}

.date-cell.range-start {
  background: #ff9f29;
  color: #ffffff;
  border-radius: 8rpx 0 0 8rpx;
}

.date-cell.range-end {
  background: #ff9f29;
  color: #ffffff;
  border-radius: 0 8rpx 8rpx 0;
}

.date-number {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.date-cell.selected .date-number,
.date-cell.range-start .date-number,
.date-cell.range-end .date-number {
  color: #ffffff;
}

.date-price {
  font-size: 20rpx;
  color: #ff9f29;
}

.date-cell.selected .date-price,
.date-cell.range-start .date-price,
.date-cell.range-end .date-price {
  color: rgba(255, 255, 255, 0.8);
}

/* 底部操作栏 */
.picker-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #ffffff;
}

.time-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.time-selector .time-label {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.9);
}

.time-picker-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 24rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.9);
}

.time-hint {
  font-size: 24rpx;
  color: #ff9f29;
}

.confirm-btn {
  width: 100%;
  background: linear-gradient(135deg, #ff9f29 0%, #ffb347 100%);
  color: #ffffff;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(255, 159, 41, 0.3);
}

.confirm-btn::after {
  border: none;
}
</style>
