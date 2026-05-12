export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  code?: string
  permissionIds?: number[]
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

export interface PermissionSelectorData {
  id: number
  name: string
  routeName: string
  operationType: string
}

export type PermissionSelectorResponseData = ApiResponseData<PermissionSelectorData[]>

export type PermissionIdsResponseData = ApiResponseData<number[]>
