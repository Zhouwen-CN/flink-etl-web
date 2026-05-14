export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数 */
  instanceId?: string
  clusterId?: number
  jobId?: number
  jobType?: number
  status?: number
}

export interface TableData {
  id: string
  clusterId: number
  jarId: number
  jobId: number
  jobType: number
  status: string
  startTime: string
  endTime: string
  duration: number
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
