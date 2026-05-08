export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：用户名 */
  username?: string
}

export interface TableData {
  id: number
  username: string
  operation: string
  ip: string
  region: string
  status: boolean
  remark: string
  createTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
