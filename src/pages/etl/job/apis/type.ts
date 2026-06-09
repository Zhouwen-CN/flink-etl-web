import type { DictionaryData } from "@/common/apis/dict/type"

export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  type: number
  clusterId?: number
  jarId?: number
  parallelism: number
  checkpointInterval?: number
  config?: string
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
  type: number
  clusterId: number
  jarId: number
  parallelism: number
  checkpointInterval: number
  config: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export interface RunJobRequestData {
  id?: number
  savepointPath?: string
}

export type ClusterSelectorDataResponseData = ApiResponseData<DictionaryData[]>
export type JarSelectorDataResponseData = ApiResponseData<DictionaryData[]>
