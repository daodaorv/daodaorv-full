<template>
  <view class="vehicle-list-page">
    <!-- 导航栏 -->
    <u-navbar
      title="房车列表"
      :background="{ backgroundColor: '#8860D0' }"
      :placeholder="true"
    />

    <!-- 搜索栏 -->
    <view class="search-section">
      <u-search
        v-model="searchKeyword"
        placeholder="搜索车型、品牌"
        :show-action="false"
        @search="handleSearch"
        @clear="handleClearSearch"
      />
    </view>

    <!-- 排序选项 -->
    <view class="sort-section">
      <u-tabs
        :list="sortOptions"
        v-model="currentSort"
        @change="handleSortChange"
        line-width="60"
        line-height="6"
        active-color="#8860D0"
        inactive-color="#666666"
        size="28"
      />
    </view>

    <!-- 车辆列表 -->
    <view class="list-container">
      <!-- 下拉刷新 -->
      <u-pull-refresh
        v-model="refreshing"
        @refresh="handleRefresh"
        bg-color="#F8F9FA"
      >
        <!-- 列表内容 -->
        <view class="vehicle-list">
          <VehicleCard
            v-for="vehicle in vehicleList"
            :key="vehicle.id"
            :id="vehicle.id"
            :name="vehicle.modelName"
            :images="vehicle.images || [defaultImage]"
            :daily-price="vehicle.dailyPrice"
            :seat-count="vehicle.seatCount"
            :bed-count="vehicle.bedCount"
            :rating="vehicle.rating || 4.5"
            :review-count="vehicle.reviewCount || 128"
            :tags="generateTags(vehicle)"
            :facilities="vehicle.facilities || []"
            :is-favorited="favoriteVehicles.includes(vehicle.id)"
            @click="handleVehicleClick"
            @toggle-favorite="handleToggleFavorite"
            @preview-image="handlePreviewImage"
          />
        </view>

        <!-- 上拉加载更多 -->
        <u-loadmore
          v-model="loadMoreStatus"
          :status="loadMoreStatus"
          margin-top="20"
          margin-bottom="20"
          bg-color="#F8F9FA"
        />
      </u-pull-refresh>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && vehicleList.length === 0">
      <u-empty
        mode="search"
        text="暂无符合条件的房车"
        description="试试调整搜索条件或筛选选项"
      >
        <u-button
          type="primary"
          size="mini"
          @click="handleClearSearch"
          text="清除搜索"
        />
      </u-empty>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <u-loading-page
        :loading="true"
        loading-text="正在加载..."
        bg-color="#F8F9FA"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { getVehicleModelList, collectVehicle, uncollectVehicle } from '@/api/modules/vehicle';
import VehicleCard from '@/components/VehicleCard.vue';
import { router } from '@/utils/router';

// 状态管理
const userStore = useUserStore();

// 响应式数据
const loading = ref(true);
const refreshing = ref(false);
const searchKeyword = ref('');
const currentSort = ref(0);
const vehicleList = ref<any[]>([]);
const favoriteVehicles = ref<string[]>([]);
const loadMoreStatus = ref<'loadmore' | 'loading' | 'nomore'>('loadmore');

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 排序选项
const sortOptions = [
  { name: '综合排序' },
  { name: '价格最低' },
  { name: '评分最高' },
  { name: '人气最高' },
];

// 默认图片
const defaultImage = 'https://picsum.photos/400/300';

// 排序映射
const sortMap = {
  0: 'comprehensive',
  1: 'price',
  2: 'rating',
  3: 'popularity',
};

// 页面参数
const pageParams = reactive({
  city: '',
  keyword: '',
});

// 生成标签
const generateTags = (vehicle: any): string[] => {
  const tags = [];

  // 新车标签（基于创建时间）
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation <= 30) {
    tags.push('新车');
  }

  // 热门标签（基于评分）
  if (vehicle.rating >= 4.8) {
    tags.push('热门');
  }

  // 推荐标签（基于综合评分）
  if (vehicle.comprehensiveScore >= 85) {
    tags.push('推荐');
  }

  return tags;
};

// 加载车辆列表
const loadVehicleList = async (reset = false) => {
  try {
    if (reset) {
      pagination.page = 1;
      vehicleList.value = [];
    }

    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value || pageParams.keyword,
      sortBy: sortMap[currentSort.value as keyof typeof sortMap],
      city: pageParams.city,
    };

    const response = await getVehicleModelList(params);

    if (response.success) {
      const newData = response.data.list;

      if (reset) {
        vehicleList.value = newData;
      } else {
        vehicleList.value.push(...newData);
      }

      pagination.total = response.data.total;

      // 更新加载状态
      if (vehicleList.value.length >= pagination.total) {
        loadMoreStatus.value = 'nomore';
      } else {
        loadMoreStatus.value = 'loadmore';
      }
    }
  } catch (error) {
    console.error('Failed to load vehicle list:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'error',
    });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  pageParams.keyword = searchKeyword.value;
  loadVehicleList(true);
};

// 清除搜索
const handleClearSearch = () => {
  searchKeyword.value = '';
  pageParams.keyword = '';
  loadVehicleList(true);
};

// 排序切换
const handleSortChange = () => {
  loadVehicleList(true);
};

// 下拉刷新
const handleRefresh = () => {
  refreshing.value = true;
  loadVehicleList(true);
};

// 上拉加载更多
const handleLoadMore = () => {
  if (loadMoreStatus.value === 'nomore' || loadMoreStatus.value === 'loading') {
    return;
  }

  loadMoreStatus.value = 'loading';
  pagination.page++;
  loadVehicleList();
};

// 车辆点击
const handleVehicleClick = (id: string) => {
  router.navigateTo(`/pages/vehicle-detail/index?id=${id}`);
};

// 收藏切换
const handleToggleFavorite = async (id: string, isFavorited: boolean) => {
  try {
    // 检查登录状态
    if (!userStore.isLoggedIn) {
      uni.showModal({
        title: '登录提示',
        content: '请先登录后再进行收藏操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            router.navigateTo('/pages/login/index');
          }
        },
      });
      return;
    }

    if (isFavorited) {
      // 取消收藏
      await uncollectVehicle(id);
      const index = favoriteVehicles.value.indexOf(id);
      if (index > -1) {
        favoriteVehicles.value.splice(index, 1);
      }
      uni.showToast({
        title: '已取消收藏',
        icon: 'success',
      });
    } else {
      // 添加收藏
      await collectVehicle(id);
      favoriteVehicles.value.push(id);
      uni.showToast({
        title: '收藏成功',
        icon: 'success',
      });
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'error',
    });
  }
};

// 图片预览
const handlePreviewImage = (images: string[], current: number) => {
  uni.previewImage({
    urls: images,
    current: current,
  });
};

// 页面加载
onLoad((options) => {
  if (options.city) {
    pageParams.city = options.city;
  }
  if (options.keyword) {
    pageParams.keyword = options.keyword;
    searchKeyword.value = options.keyword;
  }

  loadVehicleList(true);
});

// 生命周期
onReachBottom(() => {
  handleLoadMore();
});

onPullDownRefresh(() => {
  handleRefresh();
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.vehicle-list-page {
  min-height: 100vh;
  background: #F8F9FA;
}

.search-section {
  padding: 20rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.sort-section {
  background: #ffffff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.list-container {
  flex: 1;
}

.vehicle-list {
  padding: 0 20rpx;
}

.empty-state,
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>