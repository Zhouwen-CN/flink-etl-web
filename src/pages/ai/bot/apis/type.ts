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
