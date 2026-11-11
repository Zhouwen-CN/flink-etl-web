/** 接口格式（字典 ai_api_format 的值） */
export type ModelFormat = number

export interface CreateOrUpdateModelRequestData {
  id?: number
  /** 模型唯一标识 */
  name?: string
  /** 接口格式 */
  format?: ModelFormat
  /** 大模型请求地址 */
  baseUrl?: string
  /** 大模型 API KEY（留空则不更新） */
  apiKey?: string
  /** 模型名称，如 gpt-4o-mini */
  modelName?: string
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
  baseUrl: string
  modelName: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export type TestResponseData = ApiResponseData<string>
