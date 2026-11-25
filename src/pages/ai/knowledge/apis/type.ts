export interface CreateOrUpdateKnowledgeRequestData {
  /** 自增主键（更新时必填） */
  id?: number
  /** 知识库名称 */
  name?: string
  /** 知识库描述 */
  description?: string
  /** 单个分块的最大字符数，50~10000（默认800） */
  chunkSize?: number
  /** 相邻分块的重叠字符数，0~2000（默认200，须小于chunkSize） */
  overlapSize?: number
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 知识库名称（模糊查询） */
  searchName?: string
}

export interface TableData {
  /** 自增主键 */
  id: number
  /** 知识库名称 */
  name: string
  /** 知识库描述 */
  description: string
  /** 单个分块的最大字符数 */
  chunkSize: number
  /** 相邻分块的重叠字符数 */
  overlapSize: number
  /** 更新时间 */
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>
