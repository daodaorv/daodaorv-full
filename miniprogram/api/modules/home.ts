/**
 * 首页相关API接口
 */

import request from "@/utils/request";

/**
 * 获取公告列表
 */
export function getAnnouncements() {
  return request({
    url: "/api/announcements",
    method: "GET",
  });
}

/**
 * 获取轮播图列表
 */
export function getBanners() {
  return request({
    url: "/api/banners",
    method: "GET",
  });
}

/**
 * 获取城市列表
 */
export function getCities() {
  return request({
    url: "/api/cities",
    method: "GET",
  });
}

/**
 * 获取门店列表
 * @param cityId 城市ID
 */
export function getStores(cityId: string) {
  return request({
    url: "/api/stores",
    method: "GET",
    params: { cityId },
  });
}

/**
 * 获取推荐内容
 */
export function getRecommendations() {
  return request({
    url: "/api/recommendations",
    method: "GET",
  });
}

/**
 * 获取特惠商城列表
 */
export function getSpecialOffers() {
  return request({
    url: "/api/special-offers",
    method: "GET",
  });
}

/**
 * 获取社区精选帖子
 */
export function getCommunityPosts() {
  return request({
    url: "/api/community/posts",
    method: "GET",
    params: {
      page: 1,
      pageSize: 4,
    },
  });
}
