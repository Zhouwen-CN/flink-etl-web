export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  cronExpression?: string
  etlJobId?: number
}

export interface ChangeStatusRequestData {
  id: number
  jobEnable: boolean
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
  searchName?: string
}

export interface TableData {
  id: number
  name: string
  cronExpression: string
  etlJobId: number
  jobEnable: boolean
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
