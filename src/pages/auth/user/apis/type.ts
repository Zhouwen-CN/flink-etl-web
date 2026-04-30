export interface CreateOrUpdateTableRequestData {
  id?: number
  username: string
  password?: string
  nickname: string
  gender: string
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
  username?: string
}

export interface TableData {
  id: number
  username: string
  nickname: string
  gender: string
  status: boolean
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
