/**
 * 房车预订相关 API 接口
 */

import request from "@/utils/request";
import type {
  City,
  Store,
  BookingParams,
  CitiesResponse,
  StoresResponse,
  VehicleSearchResponse,
} from "@/types/booking";

/**
 * 获取可用城市列表
 */
export function getCities() {
  return request<CitiesResponse>({
    url: "/api/cities",
    method: "GET",
  });
}

/**
 * 获取城市门店列表
 * @param cityId 城市ID
 */
export function getStores(cityId: string) {
  return request<StoresResponse>({
    url: "/api/stores",
    method: "GET",
    data: { cityId },
  });
}

/**
 * 查询可用房车
 * @param params 查询参数
 */
export function searchVehicles(params: BookingParams) {
  return request<VehicleSearchResponse>({
    url: "/api/vehicles/search",
    method: "POST",
    data: params,
  });
}

/**
 * 保存用户预订记录(用于记忆功能)
 * @param params 预订参数
 */
export function saveBookingRecord(params: Partial<BookingParams>) {
  return request({
    url: "/api/booking/record",
    method: "POST",
    data: params,
  });
}

/**
 * 获取用户上次预订记录
 */
export function getBookingRecord() {
  return request({
    url: "/api/booking/record",
    method: "GET",
  });
}

// ==================== Mock 数据(开发阶段使用) ====================

/**
 * Mock: 获取城市列表
 */
export function getMockCities(): Promise<CitiesResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        cities: [
          { id: "1", name: "深圳", hot: true, pinyin: "shenzhen" },
          { id: "2", name: "上海", hot: true, pinyin: "shanghai" },
          { id: "3", name: "北京", hot: true, pinyin: "beijing" },
          { id: "4", name: "广州", hot: true, pinyin: "guangzhou" },
          { id: "5", name: "成都", hot: true, pinyin: "chengdu" },
          { id: "6", name: "杭州", hot: false, pinyin: "hangzhou" },
          { id: "7", name: "南京", hot: false, pinyin: "nanjing" },
          { id: "8", name: "武汉", hot: false, pinyin: "wuhan" },
          { id: "9", name: "西安", hot: false, pinyin: "xian" },
          { id: "10", name: "重庆", hot: false, pinyin: "chongqing" },
        ],
        hotCities: [
          { id: "1", name: "深圳", hot: true, pinyin: "shenzhen" },
          { id: "2", name: "上海", hot: true, pinyin: "shanghai" },
          { id: "3", name: "北京", hot: true, pinyin: "beijing" },
          { id: "4", name: "广州", hot: true, pinyin: "guangzhou" },
          { id: "5", name: "成都", hot: true, pinyin: "chengdu" },
        ],
      });
    }, 500);
  });
}

/**
 * Mock: 获取门店列表
 */
export function getMockStores(cityId: string): Promise<StoresResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storesByCity: Record<string, Store[]> = {
        "1": [
          {
            id: "1-1",
            name: "深圳湾门店",
            cityId: "1",
            cityName: "深圳",
            address: "深圳市南山区深圳湾体育中心",
            businessHours: "09:00-21:00",
            phone: "0755-12345678",
            isDefault: true,
          },
          {
            id: "1-2",
            name: "福田中心门店",
            cityId: "1",
            cityName: "深圳",
            address: "深圳市福田区福田中心区",
            businessHours: "09:00-21:00",
            phone: "0755-87654321",
            isDefault: false,
          },
          {
            id: "1-3",
            name: "宝安机场门店",
            cityId: "1",
            cityName: "深圳",
            address: "深圳市宝安区宝安国际机场",
            businessHours: "08:00-22:00",
            phone: "0755-11112222",
            isDefault: false,
          },
        ],
        "2": [
          {
            id: "2-1",
            name: "浦东机场门店",
            cityId: "2",
            cityName: "上海",
            address: "上海市浦东新区浦东国际机场",
            businessHours: "08:00-22:00",
            phone: "021-12345678",
            isDefault: true,
          },
          {
            id: "2-2",
            name: "虹桥枢纽门店",
            cityId: "2",
            cityName: "上海",
            address: "上海市闵行区虹桥枢纽",
            businessHours: "09:00-21:00",
            phone: "021-87654321",
            isDefault: false,
          },
        ],
        "3": [
          {
            id: "3-1",
            name: "首都机场门店",
            cityId: "3",
            cityName: "北京",
            address: "北京市顺义区首都国际机场",
            businessHours: "08:00-22:00",
            phone: "010-12345678",
            isDefault: true,
          },
          {
            id: "3-2",
            name: "国贸中心门店",
            cityId: "3",
            cityName: "北京",
            address: "北京市朝阳区国贸中心",
            businessHours: "09:00-21:00",
            phone: "010-87654321",
            isDefault: false,
          },
        ],
      };

      resolve({
        stores: storesByCity[cityId] || [],
      });
    }, 300);
  });
}

/**
 * Mock: 查询可用房车
 */
export function mockSearchVehicles(
  params: BookingParams
): Promise<VehicleSearchResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vehicles: [], // 实际车辆数据由列表页处理
        total: 25,
        params,
      });
    }, 800);
  });
}

