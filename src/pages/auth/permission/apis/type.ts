export interface CreateOrUpdateTableFormData {
  id?: number
  name: string
  /** 操作类型 */
  operationType: string
  /** 路由名称 */
  routeName: string
}

export type CreateOrUpdateTableRequestData = Pick<CreateOrUpdateTableFormData, "id" | "name"> & {
  code: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：路由名称 */
  routeName?: string
  /** 查询参数：权限编码 */
  code?: string
}

export interface TableData {
  id: number
  name: string
  code: string
  updateTime: boolean
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export interface DeleteBatchTableRequestData {
  ids: string
}
