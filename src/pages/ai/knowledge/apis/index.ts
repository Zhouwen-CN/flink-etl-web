import type * as Knowledge from "./type"
import { request } from "@/http/axios"

/** 查（分页） */
export function getKnowledgePageApi(params: Knowledge.TableRequestData) {
  return request<Knowledge.TableResponseData>({
    url: "ai/knowledge",
    method: "get",
    params
  })
}

/** 增 */
export function createKnowledgeApi(data: Knowledge.CreateOrUpdateKnowledgeRequestData) {
  return request({
    url: "ai/knowledge",
    method: "post",
    data
  })
}

/** 改 */
export function updateKnowledgeApi(data: Knowledge.CreateOrUpdateKnowledgeRequestData) {
  return request({
    url: "ai/knowledge",
    method: "put",
    data
  })
}

/** 删 */
export function deleteKnowledgeApi(id: number) {
  return request({
    url: `ai/knowledge/${id}`,
    method: "delete"
  })
}
