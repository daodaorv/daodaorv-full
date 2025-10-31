# 前端集成规范

## 统一请求封装

### C 端小程序 / 移动管理端 (Taro)

```typescript
// src/utils/request.ts
import Taro from '@tarojs/taro'

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'https://api.daodaorv.com'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {} } = options
  
  // 获取 token
  const token = Taro.getStorageSync('token')
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  
  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      }
    })
    
    const result = response.data as ApiResponse<T>
    
    // 处理业务错误
    if (result.code !== 200) {
      // 401 未授权,清除 token 并跳转登录
      if (result.code === 401) {
        Taro.removeStorageSync('token')
        Taro.navigateTo({ url: '/pages/login/index' })
      }
      
      // 显示错误提示
      Taro.showToast({
        title: result.message,
        icon: 'none',
        duration: 2000
      })
      
      throw new Error(result.message)
    }
    
    return result.data
  } catch (error: any) {
    // 网络错误
    Taro.showToast({
      title: error.message || '网络请求失败',
      icon: 'none',
      duration: 2000
    })
    throw error
  }
}

// 便捷方法
export const get = <T = any>(url: string, data?: any) => 
  request<T>({ url, method: 'GET', data })

export const post = <T = any>(url: string, data?: any) => 
  request<T>({ url, method: 'POST', data })

export const put = <T = any>(url: string, data?: any) => 
  request<T>({ url, method: 'PUT', data })

export const del = <T = any>(url: string, data?: any) => 
  request<T>({ url, method: 'DELETE', data })
```

### PC 管理端 (Vue 3 + Axios)

```typescript
// src/utils/request.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    
    // 业务成功
    if (res.code === 200) {
      return res.data
    }
    
    // 401 未授权
    if (res.code === 401) {
      ElMessage.error('登录已过期,请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
      return Promise.reject(new Error(res.message))
    }
    
    // 其他业务错误
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    console.error('Response error:', error)
    
    // 网络错误
    if (!error.response) {
      ElMessage.error('网络连接失败,请检查网络')
      return Promise.reject(error)
    }
    
    // HTTP 错误
    const status = error.response.status
    if (status === 401) {
      ElMessage.error('登录已过期,请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else if (status === 403) {
      ElMessage.error('没有权限访问')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status === 500) {
      ElMessage.error('服务器错误')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default service

// 便捷方法
export const get = <T = any>(url: string, params?: any) => 
  service.get<any, T>(url, { params })

export const post = <T = any>(url: string, data?: any) => 
  service.post<any, T>(url, data)

export const put = <T = any>(url: string, data?: any) => 
  service.put<any, T>(url, data)

export const del = <T = any>(url: string, params?: any) => 
  service.delete<any, T>(url, { params })
```

## API 封装示例

### 认证 API

```typescript
// src/api/auth.ts
import { get, post } from '@/utils/request'

export interface LoginParams {
  phone: string
  password: string
}

export interface RegisterParams {
  phone: string
  password: string
  nickname: string
}

export interface UserInfo {
  id: string
  phone: string
  nickname: string
  avatar?: string
  member_type: string
  auth_status: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}

// 用户登录
export const login = (data: LoginParams) => 
  post<LoginResult>('/api/auth/login', data)

// 用户注册
export const register = (data: RegisterParams) => 
  post<UserInfo>('/api/auth/register', data)

// 获取用户信息
export const getUserProfile = () => 
  get<UserInfo>('/api/auth/profile')

// 用户登出
export const logout = () => 
  post('/api/auth/logout')
```

### 测试 API

```typescript
// src/api/test.ts
import { get } from '@/utils/request'

export interface PingResult {
  timestamp: string
  server: string
  version: string
}

export interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  status: string
  daily_price: number
  images: string[]
  features: Record<string, any>
}

export interface VehicleListResult {
  list: Vehicle[]
  total: number
  page: number
  pageSize: number
}

// Ping 测试
export const ping = () => 
  get<PingResult>('/api/test/ping')

// Echo 测试
export const echo = (message: string) => 
  get<{ echo: string; timestamp: string }>('/api/test/echo', { message })

// 获取车辆列表
export const getVehicles = (page = 1, pageSize = 10) => 
  get<VehicleListResult>('/api/test/vehicles', { page, pageSize })

// 获取车辆详情
export const getVehicleDetail = (id: string) => 
  get<Vehicle>(`/api/test/vehicles/${id}`)
```

## 状态管理 (Pinia)

### 用户状态

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia'
import { login, getUserProfile, logout, type LoginParams, type UserInfo } from '@/api/auth'

interface UserState {
  token: string
  userInfo: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '', // PC 端
    // token: Taro.getStorageSync('token') || '', // 小程序端
    userInfo: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.userInfo?.id || ''
  },
  
  actions: {
    // 登录
    async login(params: LoginParams) {
      const result = await login(params)
      this.token = result.token
      this.userInfo = result.user
      
      // 持久化 token
      localStorage.setItem('token', result.token) // PC 端
      // Taro.setStorageSync('token', result.token) // 小程序端
      
      return result
    },
    
    // 获取用户信息
    async getUserInfo() {
      const userInfo = await getUserProfile()
      this.userInfo = userInfo
      return userInfo
    },
    
    // 登出
    async logout() {
      await logout()
      this.token = ''
      this.userInfo = null
      
      // 清除 token
      localStorage.removeItem('token') // PC 端
      // Taro.removeStorageSync('token') // 小程序端
    }
  }
})
```

## 路由守卫 (PC 管理端)

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/default.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue')
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

## 环境变量配置

### PC 管理端 (.env.development)
```
VITE_API_BASE_URL=http://localhost:3000
```

### PC 管理端 (.env.production)
```
VITE_API_BASE_URL=https://api.daodaorv.com
```

### 小程序 (config/dev.js)
```javascript
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    API_BASE_URL: '"http://localhost:3000"'
  }
}
```

### 小程序 (config/prod.js)
```javascript
module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    API_BASE_URL: '"https://api.daodaorv.com"'
  }
}
```

