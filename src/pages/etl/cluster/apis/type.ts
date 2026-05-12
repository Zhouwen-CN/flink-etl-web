export interface CreateOrUpdateTableRequestData {
  id?: number
  name: string
  ip: string
  port: number
  status: boolean
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
  ip: string
  port: number
  version: string
  status: boolean
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
