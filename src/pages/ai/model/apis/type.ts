/** 接口格式（字典 ai_api_format 的值） */
export type ModelFormat = number

/** 模型类型（字典 ai_model_type 的值） */
export type ModelType = number

export interface CreateOrUpdateModelRequestData {
  id?: number
  /** 模型唯一标识 */
  name?: string
  /** 接口格式 */
  format?: ModelFormat
  /** 模型类型 */
  type?: ModelType
  /** 大模型请求地址 */
  baseUrl?: string
  /** 大模型 API KEY（留空则不更新） */
  apiKey?: string
  /** 模型名称，如 gpt-4o-mini */
  modelName?: string
  /** 上下文窗口 */
  contextWindow?: number
  /** 是否支持图片 */
  supportImage?: boolean
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 模型唯一标识（模糊查询） */
  searchName?: string
  /** 接口格式 */
  format?: ModelFormat
}

export interface TableData {
  id: number
  name: string
  format: ModelFormat
  /** 模型类型 */
  type?: ModelType
  baseUrl: string
  modelName: string
  /** 上下文窗口 */
  contextWindow?: number
  /** 是否支持图片 */
  supportImage?: boolean
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export type TestResponseData = ApiResponseData<string>

export interface SelectorRequestData {
  /** 自增主键（apiKey 为空时，后端通过 id 获取存储的 apiKey） */
  id?: number
  /** 大模型请求地址 */
  baseUrl?: string
  /** 大模型 API KEY */
  apiKey?: string
}

export type SelectorResponseData = ApiResponseData<string[]>
