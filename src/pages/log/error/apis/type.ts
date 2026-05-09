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
  url: string
  method: string
  ip: string
  region: string
  errorMsg: string
  createUser: string
  createTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
