import type * as Bot from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createBotApi(data: Bot.CreateOrUpdateBotRequestData) {
  return request({
    url: "ai/bot",
    method: "post",
    data
  })
}

/** 删 */
export function deleteBotApi(id: number) {
  return request({
    url: `ai/bot/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateBotApi(data: Bot.CreateOrUpdateBotRequestData) {
  return request({
    url: "ai/bot",
    method: "put",
    data
  })
}

/** 查（分页） */
export function getBotPageApi(params: Bot.TableRequestData) {
  return request<Bot.TableResponseData>({
    url: "ai/bot",
    method: "get",
    params
  })
}

/** 模型选择器 */
export function getModelSelectorApi() {
  return request<Bot.ModelSelectorResponseData>({
    url: "ai/bot/model/selector",
    method: "get"
  })
}

/** MCP选择器（树形：服务节点 -> 工具叶子） */
export function getMcpSelectorApi() {
  return request<Bot.McpSelectorResponseData>({
    url: "ai/bot/mcp/selector",
    method: "get"
  })
}

/** 工具ID列表（根据bot ID查询，用作回显） */
export function getBotToolIdsApi(id: number) {
  return request<Bot.ToolIdsResponseData>({
    url: `ai/bot/tool/${id}`,
    method: "get"
  })
}

/** 部门树选择器 */
export function getDeptSelectorDataApi() {
  return request<Bot.DeptSelectorResponseData>({
    url: "ai/bot/dept/selector",
    method: "get"
  })
}
