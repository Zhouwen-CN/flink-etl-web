export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：用户名 */
  username?: string
  /** 查询参数：请求方法 */
  method?: string
}

export interface TableData {
  id: number
  url: string
  ip: string
  region: string
  method: string
  status: number
  takenTime: number
  createUser: string
  createTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
