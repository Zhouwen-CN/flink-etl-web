export interface DocTableRequestData {
  /** 知识库ID（可选，不传查询全部） */
  knowledgeId?: number
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 文件名（模糊查询） */
  searchFileName?: string
}

export interface DocTableData {
  /** 自增主键 */
  id: number
  /** 知识库id */
  knowledgeId: number
  /** 原始文件名 */
  fileName: string
  /** 文件类型 */
  fileType: string
  /** 解析状态：WAITING/PROCESSING/SUCCESS/FAILED */
  parseStatus: "WAITING" | "PROCESSING" | "SUCCESS" | "FAILED"
  /** 解析失败原因 */
  parseFailReason: string
  /** 更新时间 */
  updateTime: string
}

export type DocTableResponseData = ApiResponseData<{
  list: DocTableData[]
  total: number
}>

export interface ChunkTableRequestData {
  /** 文档ID */
  docId: number
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** 分块内容关键字（模糊查询） */
  keyword?: string
}

export interface ChunkTableData {
  /** 自增主键（同时为向量库文档ID） */
  id: number
  /** 文档id */
  documentId: number
  /** 知识库id */
  knowledgeId: number
  /** 分块内容 */
  content: string
  /** 更新时间 */
  updateTime: string
}

export type ChunkTableResponseData = ApiResponseData<{
  list: ChunkTableData[]
  total: number
}>

export interface UpdateChunkRequestData {
  /** 分块ID */
  id: number
  /** 分块内容（保存后同步重新向量化） */
  content: string
}
