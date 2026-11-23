export interface CreateOrUpdateBotRequestData {
  /** 自增主键（更新时必填） */
  id?: number
  /** bot名称 */
  name?: string
  /** 模型ID */
  modelId?: number
  /** 模型温度(0-2之间) */
  temperature?: number
  /** Top-P(0-1之间) */
  topP?: number
  /** 单次对话最大工具调用轮数 */
  maxToolCalls?: number
  /** 系统提示词 */
  systemPrompt?: string
  /** 状态: true-启用 false-停用 */
  status?: boolean
  /** 归属部门id */
  deptId?: number
  /** 工具ID列表 */
  toolIds?: number[]
  /** 知识库ID列表 */
  knowledgeIds?: number[]
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** bot名称（模糊查询） */
  searchName?: string
  /** 模型ID */
  modelId?: number
  /** 状态: true-启用 false-停用 */
  status?: boolean
}

export interface TableData {
  id: number
  modelId: number
  name: string
  temperature: number
  topP: number
  systemPrompt: string
  maxToolCalls: number
  status: boolean
  deptId: number
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

/** 模型选择器选项 */
export interface ModelSelectorOptionData {
  label: string
  value: number
}

export type ModelSelectorResponseData = ApiResponseData<ModelSelectorOptionData[]>

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

/** MCP选择器树节点（服务节点 -> 工具叶子） */
export interface McpSelectorNodeData {
  /** 工具节点为工具id，服务节点为 server-{id} */
  value: number | string
  /** 服务节点为服务名，工具节点为工具名 */
  label: string
  children: McpSelectorNodeData[]
}

export type McpSelectorResponseData = ApiResponseData<McpSelectorNodeData[]>

/** 工具ID列表（根据bot ID查询，用作回显） */
export type ToolIdsResponseData = ApiResponseData<number[]>

/** 知识库选择器（扁平列表，同字典结构：label=名称，value=ID） */
export type KnowledgeSelectorResponseData = ApiResponseData<ModelSelectorOptionData[]>

/** 知识库ID列表（根据bot ID查询，用作回显） */
export type KnowledgeIdsResponseData = ApiResponseData<number[]>
