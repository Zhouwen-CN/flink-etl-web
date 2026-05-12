import type { DictionaryRequestData } from "@/common/composables/useDictionary"

export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  clusterId?: number
  jarId?: number
  config?: string
  type?: number
}

export interface DeleteBatchTableRequestData {
  ids: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：任务名称 */
  name?: string
}

export interface TableData {
  id: number
  name: string
  clusterId: number
  jarId: number
  config: string
  type: number
  status: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export type ClusterSelectorDataResponseData = ApiResponseData<DictionaryRequestData[]>
export type JarSelectorDataResponseData = ApiResponseData<DictionaryRequestData[]>
