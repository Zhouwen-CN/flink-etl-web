export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  sort: number
  parentId?: number
}

export interface TableData {
  id: number
  name: string
  sort: number
  parentId: number
  createUser?: string
  updateTime?: string
  children: TableData[]
}

export interface GetTableRequestData {
  /** 部门名称 */
  name?: string
}

export type TableResponseData = ApiResponseData<TableData[]>
