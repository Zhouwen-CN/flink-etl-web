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

/** 部门树选择器 */
export function getDeptSelectorDataApi() {
  return request<Bot.DeptSelectorResponseData>({
    url: "ai/bot/dept/selector",
    method: "get"
  })
}
