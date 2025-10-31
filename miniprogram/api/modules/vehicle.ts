/**
 * 车辆相关API接口
 */

import request from "@/utils/request";

/**
 * 获取车型详情
 * @param id 车型ID
 */
export function getVehicleModelDetail(id: string) {
  return request({
    url: `/api/vehicle-models/${id}`,
    method: "GET",
  });
}

/**
 * 获取特惠套餐详情
 * @param id 特惠套餐ID
 */
export function getSpecialOfferDetail(id: string) {
  return request({
    url: `/api/special-offers/${id}`,
    method: "GET",
  });
}

/**
 * 获取车型列表
 * @param params 查询参数
 */
export function getVehicleModelList(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  brand?: string;
  keyword?: string;
  sortBy?: string; // 综合排序、价格、评分、人气
  city?: string; // 城市筛选
}) {
  return request({
    url: "/api/vehicle-models",
    method: "GET",
    params: {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
      category: params?.category,
      brand: params?.brand,
      keyword: params?.keyword,
      sortBy: params?.sortBy || "comprehensive",
      city: params?.city,
      isActive: true, // 只获取启用的车型
    },
  });
}

/**
 * 获取车辆评价列表
 * @param vehicleModelId 车型ID
 * @param params 分页参数
 */
export function getVehicleReviews(
  vehicleModelId: string,
  params?: { page?: number; pageSize?: number }
) {
  return request({
    url: `/api/vehicle-models/${vehicleModelId}/reviews`,
    method: "GET",
    params: {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    },
  });
}

/**
 * 收藏车辆
 * @param vehicleModelId 车型ID
 */
export function collectVehicle(vehicleModelId: string) {
  return request({
    url: `/api/user/favorites`,
    method: "POST",
    data: {
      type: "vehicle",
      targetId: vehicleModelId,
    },
  });
}

/**
 * 取消收藏车辆
 * @param vehicleModelId 车型ID
 */
export function uncollectVehicle(vehicleModelId: string) {
  return request({
    url: `/api/user/favorites/${vehicleModelId}`,
    method: "DELETE",
  });
}
