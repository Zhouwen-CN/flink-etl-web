export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  email?: string
  jobIds: number[]
}

export interface DeleteBatchTableRequestData {
  ids: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 告警名称 */
  searchName?: string
}

export interface TableData {
  id: number
  name: string
  email: string
  jobIds: string
  sendTime: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
