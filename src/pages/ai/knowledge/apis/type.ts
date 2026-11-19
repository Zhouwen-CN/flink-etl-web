export interface CreateKnowledgeRequestData {
  /** 知识库名称 */
  name: string
  /** 知识库描述 */
  description?: string
  /** 向量数据库id */
  vectorDbId: number
  /** Embedding模型id */
  embedModelId: number
  /** 最大召回条数（默认5） */
  recallTopK?: number
  /** 相似度下限，0~1（默认0.20） */
  minScore?: number
}

export interface UpdateKnowledgeRequestData {
  /** ID */
  id: number
  /** 知识库名称 */
  name: string
  /** 知识库描述 */
  description?: string
  /** 最大召回条数（默认5） */
  recallTopK?: number
  /** 相似度下限，0~1（默认0.20） */
  minScore?: number
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
  /** 向量数据库id */
  vectorDbId: number
  /** 向量库集合名/索引名 */
  collectionName: string
  /** Embedding模型id */
  embedModelId: number
  /** 向量维度 */
  dimension: number
  /** 最大召回条数 */
  recallTopK: number
  /** 相似度下限，0~1 */
  minScore: number
  /** 更新时间 */
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

/** 选择器选项 */
export interface SelectorItem {
  /** 标签 */
  label: string
  /** 值 */
  value: number
}
