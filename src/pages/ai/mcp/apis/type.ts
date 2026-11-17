export interface CreateOrUpdateMcpServerRequestData {
  /** 自增主键（更新时必填） */
  id?: number
  /** mcp服务名称 */
  name?: string
  /** mcp服务描述 */
  description?: string
  /** mcp连接配置JSON（为空表示不修改；携带脱敏占位值***的header将继承原值） */
  configJson?: string
}

export interface TableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** mcp服务名称（模糊查询） */
  searchName?: string
}

export interface TableData {
  /** 自增主键 */
  id: number
  /** mcp服务名称 */
  name: string
  /** mcp服务描述 */
  description: string
  /** mcp连接配置JSON（列表接口脱敏返回） */
  configJson: string
  /** 更新时间 */
  updateTime: string
}

export type TableResponseData = ApiResponseData<{
  list: TableData[]
  total: number
}>

/** MCP 工具分页请求 */
export interface McpToolTableRequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  pageSize: number
  /** mcp服务id */
  serverId: number
  /** 工具名（模糊查询） */
  searchName?: string
}

/** MCP 工具 */
export interface McpToolTableData {
  /** 自增主键 */
  id: number
  /** mcp服务id */
  serverId: number
  /** 工具名 */
  name: string
  /** 工具描述 */
  description: string
  /** 自定义输出模板 */
  outputTemplate: string | null
  /** 更新时间（兼作最近同步时间） */
  updateTime: string
}

export type McpToolTableResponseData = ApiResponseData<{
  list: McpToolTableData[]
  total: number
}>

/** 更新 MCP 工具请求（仅用户可配置字段） */
export interface UpdateMcpToolRequestData {
  /** ID */
  id: number
  /** 自定义输出模板，传 null 表示清空 */
  outputTemplate?: string | null
}
