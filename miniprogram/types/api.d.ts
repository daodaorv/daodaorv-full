/**
 * API 类型定义
 */

declare namespace API {
  /**
   * 通用响应格式
   */
  interface Response<T = any> {
    code: number
    message: string
    data: T
  }
  
  /**
   * 分页参数
   */
  interface PageParams {
    page: number
    pageSize: number
  }
  
  /**
   * 分页结果
   */
  interface PageResult<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
}

