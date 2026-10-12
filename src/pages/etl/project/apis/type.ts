export interface CreateOrUpdateTableRequestData {
  id?: number
  name?: string
  description?: string
  deptId?: number
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
  deptId: number
  createUser: string
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

/** 部门树节点 */
export interface DeptVO {
  id: number
  parentId: number | null
  name: string
  sort: number
  createUser: string
  updateTime: string
  children: DeptVO[]
}

export type DeptSelectorResponseData = ApiResponseData<DeptVO[]>
