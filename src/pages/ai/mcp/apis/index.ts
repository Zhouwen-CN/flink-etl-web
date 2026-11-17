import type * as McpServer from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createMcpServerApi(data: McpServer.CreateOrUpdateMcpServerRequestData) {
  return request({
    url: "ai/mcp",
    method: "post",
    data
  })
}

/** 删 */
export function deleteMcpServerApi(id: number) {
  return request({
    url: `ai/mcp/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateMcpServerApi(data: McpServer.CreateOrUpdateMcpServerRequestData) {
  return request({
    url: "ai/mcp",
    method: "put",
    data
  })
}

/** 查（分页） */
export function getMcpServerPageApi(params: McpServer.TableRequestData) {
  return request<McpServer.TableResponseData>({
    url: "ai/mcp",
    method: "get",
    params
  })
}

/** 手动同步工具 */
export function syncMcpServerToolsApi(id: number) {
  return request({
    url: `ai/mcp/sync/${id}`,
    method: "post"
  })
}

/** 工具查（分页，指定 MCP 服务） */
export function getMcpToolPageApi(params: McpServer.McpToolTableRequestData) {
  return request<McpServer.McpToolTableResponseData>({
    url: "ai/mcp/tool",
    method: "get",
    params
  })
}

/** 工具改（更新自定义输出模板） */
export function updateMcpToolApi(data: McpServer.UpdateMcpToolRequestData) {
  return request({
    url: "ai/mcp/tool",
    method: "put",
    data
  })
}
