export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  type: number
  projectId?: number
  clusterId?: number
  jarId?: number
  parallelism: number
  checkpointInterval?: number
  config?: string
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
  name?: string
  /** 查询参数：任务类型 */
  type?: number
  /** 查询参数：项目ID */
  projectId?: number
}

export interface TableData {
  id: number
  name: string
  type: number
  projectId: number
  clusterId: number
  jarId: number
  parallelism: number
  checkpointInterval: number
  config: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export interface RunJobRequestData {
  id?: number
  savepointPath?: string
}
