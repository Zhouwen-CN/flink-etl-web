import type { UploadUserFile } from "element-plus"

export interface CreateTableRequestData {
  name: string
  file?: UploadUserFile
}

export interface DeleteBatchTableRequestData {
  ids: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：用户名 */
  name?: string
}

export interface TableData {
  id: number
  name: string
  path: string
  mainClass: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
