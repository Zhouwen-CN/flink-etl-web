export interface CreateOrUpdateTableRequestData {
  id?: number
  username?: string
  password?: string
  nickname?: string
  gender: number
  status: boolean
  roleIds?: number[]
  deptId?: number
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
  gender: number
  status: boolean
  deptId: number
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

export type RoleIdsResponseData = ApiResponseData<number[]>

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
