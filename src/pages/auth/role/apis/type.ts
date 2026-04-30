export interface CreateOrUpdateTableRequestData {
  id?: number
  name: string
  code: string
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
  roleName?: string
}

export interface TableData {
  id: number
  name: string
  code: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
