<template>
  <view class="home-page">
    <!-- 1. 公告栏 -->
    <NoticeBar :notices="notices" @click="handleNoticeClick" />

    <!-- 2. 轮播图 -->
    <BannerSwiper :banners="banners" @click="handleBannerClick" />

    <!-- 3. 房车预订模块 -->
    <BookingModule @search="handleSearch" />

    <!-- 4. 特惠商城 -->
    <SpecialOffers
      :offers="offers"
      @offerClick="handleOfferClick"
      @moreClick="handleMoreOffers"
    />

    <!-- 5. 金刚区 -->
    <ServiceGrid :services="services" @serviceClick="handleServiceClick" />

    <!-- 6. 会员卡 -->
    <MembershipCard @click="handleMembershipClick" />

    <!-- 7. 社区精选 -->
    <CommunitySection
      :posts="communityPosts"
      @postClick="handlePostClick"
      @moreClick="handleMoreCommunity"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import NoticeBar from "./components/NoticeBar.vue";
import BannerSwiper from "./components/BannerSwiper.vue";
import BookingModule from "./components/BookingModule.vue";
import SpecialOffers from "./components/SpecialOffers.vue";
import ServiceGrid from "./components/ServiceGrid.vue";
import MembershipCard from "./components/MembershipCard.vue";
import CommunitySection from "./components/CommunitySection.vue";
import { getSpecialOffers, getCommunityPosts } from "@/api/modules/home";

// 页面状态
const loading = ref(false);
const refreshing = ref(false);

// 公告数据
const notices = ref([
  "【限时优惠】国庆房车租赁立减500元，先到先得！",
  "【新用户福利】注册即送200元优惠券",
  "【活动通知】周末房车露营活动火热报名中",
]);

// 轮播图数据
const banners = ref([
  { title: "🎉 营销活动 1" },
  { title: "🎊 营销活动 2" },
  { title: "🎁 营销活动 3" },
]);

// 特惠商城数据
const offers = ref<any[]>([]);

// 金刚区数据
const services = ref([
  { icon: "🎁", name: "特惠租车" },
  { icon: "🚐", name: "房车租赁" },
  { icon: "🏕️", name: "营地预订" },
  { icon: "✈️", name: "定制旅游" },
  { icon: "💰", name: "众筹房车" },
  { icon: "📢", name: "推广分享" },
  { icon: "🤝", name: "加盟合作" },
  { icon: "👑", name: "PLUS会员" },
]);

// 社区精选数据
const communityPosts = ref<any[]>([]);

/**
 * 加载首页数据
 */
const loadHomeData = async () => {
  try {
    loading.value = true;

    // 并行加载特惠商城和社区精选数据
    const [offersRes, postsRes] = await Promise.all([
      getSpecialOffers().catch(() => ({ data: { offers: [] } })),
      getCommunityPosts().catch(() => ({ data: { posts: [] } })),
    ]);

    // 处理特惠商城数据
    if (offersRes.data?.offers && offersRes.data.offers.length > 0) {
      offers.value = offersRes.data.offers.slice(0, 3).map((offer: any) => ({
        id: offer.id,
        title: offer.name,
        subtitle: `${offer.pickupCity} → ${offer.returnCity} · ${offer.fixedDays}天`,
        price: offer.offerPrice,
      }));
    } else {
      // 如果没有数据,使用默认数据
      offers.value = [
        { id: "1", title: "房车租赁", subtitle: "适用于3天租期", price: 50 },
        { id: "2", title: "思特租车", subtitle: "楼盘", price: 200 },
        { id: "3", title: "长期租赁", subtitle: "适用于1个月", price: 500 },
      ];
    }

    // 处理社区精选数据 (注意:后端返回的是 data.list 不是 data.posts)
    const posts = postsRes.data?.list || postsRes.data?.posts || [];
    if (posts.length > 0) {
      communityPosts.value = posts.slice(0, 4).map((post: any) => ({
        id: post.id,
        title: post.title,
        placeholder: `Post ${post.id}`,
        stats: `👍 ${post.likeCount || 0} · 💬 ${post.commentCount || 0}`,
      }));
    } else {
      // 如果没有数据,使用默认数据
      communityPosts.value = [
        {
          id: "1",
          title: "西藏自驾游记:从成都到拉萨的房车之旅",
          placeholder: "Post 1",
          stats: "🔥 热门 · 234 赞 · 855 评论",
        },
        {
          id: "2",
          title: "新疆环线攻略:最适合房车的风景线路",
          placeholder: "Post 2",
          stats: "📍 攻略 · 156 赞 · 234 评论",
        },
      ];
    }
  } catch (error) {
    console.error("加载首页数据失败:", error);
    uni.showToast({
      title: "加载数据失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

/**
 * 下拉刷新
 */
const onRefresh = () => {
  refreshing.value = true;
  loadHomeData();
};

// 事件处理
const handleNoticeClick = (notice: string) => {
  console.log("点击公告:", notice);
  uni.showToast({
    title: "公告详情功能开发中",
    icon: "none",
  });
};

const handleBannerClick = (banner: any) => {
  console.log("点击轮播图:", banner);
  uni.showToast({
    title: "活动详情功能开发中",
    icon: "none",
  });
};

const handleSearch = (params: any) => {
  console.log("查询房车:", params);

  // 跳转到房车列表页
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  uni.navigateTo({
    url: `/pages/vehicle-list/index?${queryString}`,
  });
};

const handleOfferClick = (offer: any) => {
  console.log("点击特惠:", offer);
  // 跳转到车辆详情页 (特惠租车)
  if (offer.id) {
    uni.navigateTo({
      url: `/pages/vehicle-detail/index?biz=special&id=${offer.id}`,
    });
  } else {
    uni.showToast({
      title: "商品信息不完整",
      icon: "none",
    });
  }
};

const handleMoreOffers = () => {
  console.log("查看更多特惠");
  uni.showToast({
    title: "特惠商城功能开发中",
    icon: "none",
  });
};

const handleServiceClick = (service: any) => {
  console.log("点击服务:", service);
  uni.showToast({
    title: `${service.name}功能开发中`,
    icon: "none",
  });
};

const handleMembershipClick = () => {
  console.log("点击会员卡");
  uni.showToast({
    title: "会员中心功能开发中",
    icon: "none",
  });
};

const handlePostClick = (post: any) => {
  console.log("点击帖子:", post);
  uni.showToast({
    title: "帖子详情功能开发中",
    icon: "none",
  });
};

const handleMoreCommunity = () => {
  console.log("进入社区");
  uni.showToast({
    title: "社区功能开发中",
    icon: "none",
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadHomeData();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 120rpx;
}
</style>
