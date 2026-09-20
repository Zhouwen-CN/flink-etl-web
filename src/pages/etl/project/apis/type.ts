export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  description?: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：项目名称 */
  name?: string
}

export interface TableData {
  id: number
  name: string
  description: string
  createUser: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
