/**
 * 全局类型声明
 */

import type router from '@/utils/router'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /** 路由工具 */
    $router: typeof router
  }
}

export {}

