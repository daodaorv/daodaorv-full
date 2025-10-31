<template>
  <view class="datetime-picker" v-if="visible">
    <!-- 遮罩层 -->
    <view class="picker-mask" @click="handleClose"></view>

    <!-- 选择器内容 -->
    <view class="picker-content">
      <!-- 头部 -->
      <view class="picker-header">
        <text class="header-cancel" @click="handleClose">取消</text>
        <text class="header-title">{{ title }}</text>
        <text class="header-confirm" @click="handleConfirm">确定</text>
      </view>

      <!-- 日期时间选择 -->
      <view class="picker-body">
        <!-- 日期选择 -->
        <picker
          mode="date"
          :value="selectedDate"
          :start="minDate"
          :end="maxDate"
          @change="handleDateChange"
        >
          <view class="picker-item">
            <text class="item-label">日期</text>
            <view class="item-value">
              <text>{{ formattedDate }}</text>
              <text class="item-arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 时间选择 -->
        <picker
          mode="time"
          :value="selectedTime"
          @change="handleTimeChange"
          :disabled="mode === 'return'"
        >
          <view class="picker-item" :class="{ disabled: mode === 'return' }">
            <text class="item-label">时间</text>
            <view class="item-value">
              <text>{{ selectedTime }}</text>
              <text class="item-arrow" v-if="mode !== 'return'">›</text>
              <text class="item-hint" v-if="mode === 'return'">与取车时间同步</text>
            </view>
          </view>
        </picker>

        <!-- 提示信息 -->
        <view class="picker-hint">
          <text v-if="mode === 'pickup'">取车时间最早为当前时间+4小时</text>
          <text v-else>还车时间点将自动与取车时间点保持一致</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";

interface Props {
  visible: boolean;
  modelValue: string; // ISO 格式时间字符串
  mode: "pickup" | "return"; // 取车或还车
  minTime?: string; // 最早可选时间
  maxTime?: string; // 最晚可选时间
  pickupTime?: string; // 取车时间(用于还车时间同步)
}

const props = withDefaults(defineProps<Props>(), {
  minTime: "",
  maxTime: "",
  pickupTime: "",
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  "update:modelValue": [time: string];
  confirm: [time: string];
}>();

// 标题
const title = computed(() => {
  return props.mode === "pickup" ? "选择取车时间" : "选择还车时间";
});

// 选中的日期和时间
const selectedDate = ref("");
const selectedTime = ref("");

// 初始化选中值
const initSelectedValue = () => {
  if (props.modelValue) {
    const date = dayjs(props.modelValue);
    selectedDate.value = date.format("YYYY-MM-DD");
    selectedTime.value = date.format("HH:mm");
  } else {
    const now = dayjs();
    selectedDate.value = now.format("YYYY-MM-DD");
    selectedTime.value = now.format("HH:mm");
  }
};

// 监听 visible 变化,打开时初始化
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      initSelectedValue();
    }
  },
  { immediate: true }
);

// 最小日期
const minDate = computed(() => {
  if (props.minTime) {
    return dayjs(props.minTime).format("YYYY-MM-DD");
  }
  if (props.mode === "pickup") {
    // 取车时间最早为当前时间+4小时
    return dayjs().add(4, "hour").format("YYYY-MM-DD");
  }
  return dayjs().format("YYYY-MM-DD");
});

// 最大日期
const maxDate = computed(() => {
  if (props.maxTime) {
    return dayjs(props.maxTime).format("YYYY-MM-DD");
  }
  if (props.mode === "pickup") {
    // 取车时间最晚为当前时间+6个月
    return dayjs().add(6, "month").format("YYYY-MM-DD");
  }
  return dayjs().add(6, "month").format("YYYY-MM-DD");
});

// 格式化日期显示
const formattedDate = computed(() => {
  if (!selectedDate.value) return "请选择";
  const date = dayjs(selectedDate.value);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekDay = weekDays[date.day()];
  return `${date.format("YYYY年MM月DD日")} 周${weekDay}`;
});

// 处理日期变化
const handleDateChange = (e: any) => {
  selectedDate.value = e.detail.value;

  // 如果是还车模式,自动同步时间点
  if (props.mode === "return" && props.pickupTime) {
    const pickupDate = dayjs(props.pickupTime);
    selectedTime.value = pickupDate.format("HH:mm");
  }
};

// 处理时间变化
const handleTimeChange = (e: any) => {
  if (props.mode === "return") return; // 还车时间不允许手动修改时间点
  selectedTime.value = e.detail.value;
};

// 确认选择
const handleConfirm = () => {
  // 组合日期和时间
  const dateTimeStr = `${selectedDate.value} ${selectedTime.value}`;
  const dateTime = dayjs(dateTimeStr);

  // 验证时间
  if (!validateDateTime(dateTime)) {
    return;
  }

  const isoString = dateTime.toISOString();
  emit("update:modelValue", isoString);
  emit("confirm", isoString);
  handleClose();
};

// 验证时间
const validateDateTime = (dateTime: dayjs.Dayjs): boolean => {
  const now = dayjs();

  if (props.mode === "pickup") {
    // 取车时间验证
    const minPickupTime = now.add(4, "hour");
    if (dateTime.isBefore(minPickupTime)) {
      uni.showToast({
        title: "取车时间最早为当前时间+4小时",
        icon: "none",
      });
      return false;
    }

    const maxPickupTime = now.add(6, "month");
    if (dateTime.isAfter(maxPickupTime)) {
      uni.showToast({
        title: "取车时间最晚为当前时间+6个月",
        icon: "none",
      });
      return false;
    }
  } else {
    // 还车时间验证
    if (props.pickupTime) {
      const pickupDate = dayjs(props.pickupTime);
      const minReturnTime = pickupDate.add(2, "day");

      if (dateTime.isBefore(minReturnTime)) {
        uni.showToast({
          title: "租赁时长至少2天(48小时)",
          icon: "none",
        });
        return false;
      }

      const maxReturnTime = pickupDate.add(60, "day");
      if (dateTime.isAfter(maxReturnTime)) {
        uni.showToast({
          title: "租赁时长最长60天",
          icon: "none",
        });
        return false;
      }
    }
  }

  return true;
};

// 关闭选择器
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.datetime-picker {
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
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
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

/* 选择器主体 */
.picker-body {
  padding: 24rpx 0;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-item.disabled {
  opacity: 0.6;
}

.item-label {
  font-size: 30rpx;
  color: rgba(0, 0, 0, 0.9);
}

.item-value {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 30rpx;
  color: #666;
}

.item-arrow {
  font-size: 32rpx;
  color: #999;
}

.item-hint {
  font-size: 24rpx;
  color: #ff9f29;
}

.picker-hint {
  padding: 24rpx 32rpx;
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}
</style>

