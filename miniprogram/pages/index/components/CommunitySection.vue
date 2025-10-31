<template>
  <view class="community-section">
    <view class="module-title">
      <text class="title-icon">⭐</text>
      <text class="title-text">社区热门推荐</text>
    </view>

    <!-- 分类 Tab -->
    <view class="category-tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 内容列表 -->
    <view class="community-list">
      <view
        v-for="(post, index) in displayPosts"
        :key="index"
        class="community-card"
        @click="handlePostClick(post)"
      >
        <view class="community-cover">{{ post.placeholder }}</view>
        <view class="community-content">
          <view class="community-title">{{ post.title }}</view>
          <view class="community-meta">
            <view class="author-info">
              <text class="author-avatar">👤</text>
              <text class="author-name">{{ post.author || "房车旅行家" }}</text>
              <text class="author-badge">{{ post.badge || "认证" }}</text>
            </view>
            <view class="post-stats">
              <text>👍 {{ post.likes || "1.2k" }}</text>
              <text>👁 {{ post.views || "5.8k" }}</text>
            </view>
          </view>
          <view class="community-tags">
            <text
              v-for="(tag, tagIndex) in post.tags"
              :key="tagIndex"
              class="tag"
              >{{ tag }}</text
            >
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Post {
  id?: string;
  title: string;
  placeholder: string;
  author?: string;
  badge?: string;
  likes?: string;
  views?: string;
  tags?: string[];
  category?: string;
}

interface Props {
  posts?: Post[];
}

const props = withDefaults(defineProps<Props>(), {
  posts: () => [
    {
      title: "川藏线房车自驾攻略 | 10天9夜完整路线",
      placeholder: "封面图",
      author: "房车旅行家",
      badge: "认证",
      likes: "1.2k",
      views: "5.8k",
      tags: ["川藏线", "自驾攻略"],
      category: "攻略",
    },
    {
      title: "新疆独库公路房车之旅 | 最美景观大道",
      placeholder: "封面图",
      author: "旅行达人",
      badge: "认证",
      likes: "2.3k",
      views: "8.9k",
      tags: ["新疆", "独库公路"],
      category: "攻略",
    },
    {
      title: "房车露营装备清单 | 新手必看",
      placeholder: "封面图",
      author: "露营专家",
      badge: "官方",
      likes: "3.4k",
      views: "12.5k",
      tags: ["露营", "装备"],
      category: "体验",
    },
    {
      title: "周末房车露营活动 | 深圳站报名中",
      placeholder: "封面图",
      author: "道道房车",
      badge: "官方",
      likes: "890",
      views: "3.2k",
      tags: ["活动", "深圳"],
      category: "活动",
    },
  ],
});

const emit = defineEmits<{
  postClick: [post: Post];
  moreClick: [];
}>();

// 分类 Tab
const tabs = [
  { label: "全部", value: "all" },
  { label: "攻略", value: "攻略" },
  { label: "体验", value: "体验" },
  { label: "活动", value: "活动" },
];

const activeTab = ref("all");

// 根据分类筛选内容
const displayPosts = computed(() => {
  if (activeTab.value === "all") {
    return props.posts;
  }
  return props.posts.filter((post) => post.category === activeTab.value);
});

const handleTabChange = (tab: string) => {
  activeTab.value = tab;
};

const handlePostClick = (post: Post) => {
  emit("postClick", post);
};

const handleMoreClick = () => {
  emit("moreClick");
};
</script>

<style scoped>
.community-section {
  margin: 24rpx 32rpx;
}

.module-title {
  font-size: 36rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 24rpx;
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

/* 分类 Tab */
.category-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding: 6rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.5);
  border-radius: 8rpx;
  transition: all 0.3s;
  cursor: pointer;
}

.tab-item.active {
  background: #ffffff;
  color: #ff9f29;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

/* 内容列表 */
.community-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.community-card {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background: #f7f8fa;
  border-radius: 16rpx;
  transition: all 0.3s;
  cursor: pointer;
}

.community-card:active {
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transform: translateY(-2rpx);
}

.community-cover {
  width: 180rpx;
  height: 135rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, #8860d0 0%, #a78bfa 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}

.community-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.community-title {
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8rpx;
}

.community-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.author-avatar {
  font-size: 24rpx;
}

.author-name {
  font-size: 24rpx;
  color: rgba(0, 0, 0, 0.7);
}

.author-badge {
  font-size: 20rpx;
  color: #ff9f29;
  padding: 2rpx 8rpx;
  background: rgba(255, 159, 41, 0.1);
  border-radius: 4rpx;
}

.post-stats {
  display: flex;
  gap: 16rpx;
  font-size: 22rpx;
  color: rgba(0, 0, 0, 0.5);
}

.community-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 20rpx;
  color: rgba(0, 0, 0, 0.5);
  padding: 4rpx 12rpx;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4rpx;
}
</style>
