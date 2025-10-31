/**
 * 房车预订状态管理
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { City, Store, BookingRecord } from "@/types/booking";
import { getMockCities, getMockStores } from "@/api/modules/booking";

const STORAGE_KEY_BOOKING_RECORD = "booking_record";
const CACHE_KEY_CITIES = "cache_cities";
const CACHE_KEY_STORES = "cache_stores";
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export const useBookingStore = defineStore("booking", () => {
  // ==================== 状态 ====================
  const cities = ref<City[]>([]);
  const hotCities = ref<City[]>([]);
  const storesMap = ref<Record<string, Store[]>>({}); // 按城市ID索引的门店列表
  const loading = ref(false);
  const lastRecord = ref<BookingRecord | null>(null);

  // ==================== 计算属性 ====================
  const allCities = computed(() => cities.value);
  const popularCities = computed(() => hotCities.value);

  // ==================== 缓存工具函数 ====================

  /**
   * 保存缓存到本地存储
   */
  const saveCache = <T>(key: string, data: T) => {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
      };
      uni.setStorageSync(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error("保存缓存失败:", error);
    }
  };

  /**
   * 从本地存储读取缓存
   */
  const getCache = <T>(key: string): T | null => {
    try {
      const cacheStr = uni.getStorageSync(key);
      if (!cacheStr) return null;

      const cacheData: CacheData<T> = JSON.parse(cacheStr);
      const now = Date.now();

      // 检查缓存是否过期
      if (now - cacheData.timestamp > CACHE_DURATION) {
        uni.removeStorageSync(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error("读取缓存失败:", error);
      return null;
    }
  };

  /**
   * 清除缓存
   */
  const clearCache = (key: string) => {
    try {
      uni.removeStorageSync(key);
    } catch (error) {
      console.error("清除缓存失败:", error);
    }
  };

  // ==================== Actions ====================

  /**
   * 加载城市列表
   */
  const loadCities = async (forceRefresh = false) => {
    // 如果已有数据且不强制刷新,直接返回
    if (cities.value.length > 0 && !forceRefresh) {
      return;
    }

    // 尝试从缓存读取
    if (!forceRefresh) {
      const cached = getCache<{ cities: City[]; hotCities: City[] }>(
        CACHE_KEY_CITIES
      );
      if (cached) {
        cities.value = cached.cities;
        hotCities.value = cached.hotCities;
        return;
      }
    }

    // 从 API 加载
    try {
      loading.value = true;
      const response = await getMockCities();
      cities.value = response.cities;
      hotCities.value = response.hotCities;

      // 保存到缓存
      saveCache(CACHE_KEY_CITIES, {
        cities: response.cities,
        hotCities: response.hotCities,
      });
    } catch (error) {
      console.error("加载城市列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载门店列表
   */
  const loadStores = async (cityId: string, forceRefresh = false) => {
    // 如果已有数据且不强制刷新,直接返回
    if (storesMap.value[cityId] && !forceRefresh) {
      return storesMap.value[cityId];
    }

    // 尝试从缓存读取
    const cacheKey = `${CACHE_KEY_STORES}_${cityId}`;
    if (!forceRefresh) {
      const cached = getCache<Store[]>(cacheKey);
      if (cached) {
        storesMap.value[cityId] = cached;
        return cached;
      }
    }

    // 从 API 加载
    try {
      loading.value = true;
      const response = await getMockStores(cityId);
      storesMap.value[cityId] = response.stores;

      // 保存到缓存
      saveCache(cacheKey, response.stores);

      return response.stores;
    } catch (error) {
      console.error("加载门店列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取城市的默认门店
   */
  const getDefaultStore = (cityId: string): Store | null => {
    const stores = storesMap.value[cityId];
    if (!stores || stores.length === 0) return null;

    return stores.find((store) => store.isDefault) || stores[0];
  };

  /**
   * 根据ID获取城市信息
   */
  const getCityById = (cityId: string): City | null => {
    return cities.value.find((city) => city.id === cityId) || null;
  };

  /**
   * 根据ID获取门店信息
   */
  const getStoreById = (cityId: string, storeId: string): Store | null => {
    const stores = storesMap.value[cityId];
    if (!stores) return null;

    return stores.find((store) => store.id === storeId) || null;
  };

  /**
   * 保存用户选择记录
   */
  const saveRecord = (record: BookingRecord) => {
    try {
      lastRecord.value = record;
      uni.setStorageSync(STORAGE_KEY_BOOKING_RECORD, JSON.stringify(record));
    } catch (error) {
      console.error("保存用户记录失败:", error);
    }
  };

  /**
   * 读取用户选择记录
   */
  const loadRecord = (): BookingRecord | null => {
    try {
      const recordStr = uni.getStorageSync(STORAGE_KEY_BOOKING_RECORD);
      if (!recordStr) return null;

      const record: BookingRecord = JSON.parse(recordStr);
      lastRecord.value = record;
      return record;
    } catch (error) {
      console.error("读取用户记录失败:", error);
      return null;
    }
  };

  /**
   * 清除所有缓存
   */
  const clearAllCache = () => {
    clearCache(CACHE_KEY_CITIES);
    // 清除所有门店缓存
    Object.keys(storesMap.value).forEach((cityId) => {
      clearCache(`${CACHE_KEY_STORES}_${cityId}`);
    });
    storesMap.value = {};
  };

  /**
   * 重置状态
   */
  const reset = () => {
    cities.value = [];
    hotCities.value = [];
    storesMap.value = {};
    lastRecord.value = null;
    loading.value = false;
  };

  return {
    // 状态
    cities,
    hotCities,
    storesMap,
    loading,
    lastRecord,

    // 计算属性
    allCities,
    popularCities,

    // Actions
    loadCities,
    loadStores,
    getDefaultStore,
    getCityById,
    getStoreById,
    saveRecord,
    loadRecord,
    clearAllCache,
    reset,
  };
});

