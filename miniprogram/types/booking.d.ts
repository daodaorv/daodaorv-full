/**
 * 房车预订相关类型定义
 */

/**
 * 城市信息
 */
export interface City {
  id: string;
  name: string;
  hot: boolean; // 是否热门城市
  pinyin?: string; // 拼音,用于搜索
  latitude?: number;
  longitude?: number;
}

/**
 * 门店信息
 */
export interface Store {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  address: string;
  businessHours: string; // 营业时间,如 "09:00-21:00"
  phone?: string;
  isDefault: boolean; // 是否为默认门店
  latitude?: number;
  longitude?: number;
}

/**
 * 预订参数
 */
export interface BookingParams {
  pickupCityId: string;
  pickupCityName: string;
  pickupStoreId: string;
  pickupStoreName: string;
  returnCityId: string;
  returnCityName: string;
  returnStoreId: string;
  returnStoreName: string;
  pickupTime: string; // ISO 格式时间字符串
  returnTime: string; // ISO 格式时间字符串
  differentReturn: boolean; // 是否异地还车
  rentalDays: number; // 租期天数
}

/**
 * 用户选择记录(用于记忆功能)
 */
export interface BookingRecord {
  pickupCityId: string;
  pickupCityName: string;
  pickupStoreId: string;
  pickupStoreName: string;
  differentReturn: boolean;
  timestamp: number; // 记录时间戳
}

/**
 * 时间选择器配置
 */
export interface DateTimePickerConfig {
  mode: 'pickup' | 'return'; // 取车或还车
  minTime?: string; // 最早可选时间
  maxTime?: string; // 最晚可选时间
  pickupTime?: string; // 取车时间(用于还车时间同步)
  businessHours?: string; // 营业时间,如 "09:00-21:00"
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  field?: string; // 错误字段
}

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 城市列表响应
 */
export interface CitiesResponse {
  cities: City[];
  hotCities: City[]; // 热门城市
}

/**
 * 门店列表响应
 */
export interface StoresResponse {
  stores: Store[];
}

/**
 * 车辆搜索响应
 */
export interface VehicleSearchResponse {
  vehicles: any[]; // 车辆列表
  total: number;
  params: BookingParams; // 查询参数
}

