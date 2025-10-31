/**
 * 城市选择状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCityStore = defineStore('city', () => {
  // 当前选中的城市
  const selectedCity = ref<string>('')
  const selectedCityId = ref<string>('')
  
  // 当前选中的门店
  const selectedStore = ref<string>('')
  const selectedStoreId = ref<string>('')

  // 城市列表
  const cities = ref<any[]>([])
  
  // 门店列表
  const stores = ref<any[]>([])

  /**
   * 设置选中的城市
   */
  function setCity(cityId: string, cityName: string) {
    selectedCityId.value = cityId
    selectedCity.value = cityName
    
    // 保存到本地存储
    uni.setStorageSync('selectedCityId', cityId)
    uni.setStorageSync('selectedCity', cityName)
    
    // 清空门店选择
    selectedStoreId.value = ''
    selectedStore.value = ''
  }

  /**
   * 设置选中的门店
   */
  function setStore(storeId: string, storeName: string) {
    selectedStoreId.value = storeId
    selectedStore.value = storeName
    
    // 保存到本地存储
    uni.setStorageSync('selectedStoreId', storeId)
    uni.setStorageSync('selectedStore', storeName)
  }

  /**
   * 从本地存储恢复城市和门店选择
   */
  function restoreFromStorage() {
    const cityId = uni.getStorageSync('selectedCityId')
    const cityName = uni.getStorageSync('selectedCity')
    const storeId = uni.getStorageSync('selectedStoreId')
    const storeName = uni.getStorageSync('selectedStore')
    
    if (cityId && cityName) {
      selectedCityId.value = cityId
      selectedCity.value = cityName
    }
    
    if (storeId && storeName) {
      selectedStoreId.value = storeId
      selectedStore.value = storeName
    }
  }

  /**
   * 设置城市列表
   */
  function setCities(list: any[]) {
    cities.value = list
  }

  /**
   * 设置门店列表
   */
  function setStores(list: any[]) {
    stores.value = list
  }

  /**
   * 清空选择
   */
  function clear() {
    selectedCityId.value = ''
    selectedCity.value = ''
    selectedStoreId.value = ''
    selectedStore.value = ''
    
    uni.removeStorageSync('selectedCityId')
    uni.removeStorageSync('selectedCity')
    uni.removeStorageSync('selectedStoreId')
    uni.removeStorageSync('selectedStore')
  }

  return {
    selectedCity,
    selectedCityId,
    selectedStore,
    selectedStoreId,
    cities,
    stores,
    setCity,
    setStore,
    restoreFromStorage,
    setCities,
    setStores,
    clear
  }
})

