export interface CreateOrUpdateTableRequestData {
  id?: number
  typeId?: number
  label?: string
  value?: number
  sortId: number
}

export interface DeleteBatchTableRequestData {
  ids: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 查询参数：字典label */
  name?: string
  typeId: number
}

export interface TableData {
  id: number
  typeId: number
  label: string
  value: number
  sortId: number
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
