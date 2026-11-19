export interface CreateOrUpdateVectorDatabaseRequestData {
  /** 自增主键（更新时必填） */
  id?: number
  /** 向量数据库名称 */
  name?: string
  /** 向量数据库类型（1-redis 2-milvus） */
  type?: number
  /** 向量数据库描述 */
  description?: string
  /** 连接配置JSON */
  configJson?: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 向量数据库名称（模糊查询） */
  searchName?: string
}

export interface TableData {
  /** 自增主键 */
  id: number
  /** 向量数据库名称 */
  name: string
  /** 向量数据库类型（1-redis 2-milvus） */
  type: number
  /** 向量数据库描述 */
  description: string
  /** 连接配置JSON */
  configJson: string
  /** 更新时间 */
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

/** 连接验证请求（支持未保存配置） */
export interface VerifyVectorDatabaseRequestData {
  /** 向量数据库类型（1-redis 2-milvus） */
  type: number
  /** 连接配置JSON */
  configJson: string
}
