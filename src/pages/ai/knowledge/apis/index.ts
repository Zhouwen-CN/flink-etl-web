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

/** 向量数据库选择器 */
export function getVectorDbSelectorApi() {
  return request<ApiResponseData<Knowledge.SelectorItem[]>>({
    url: "ai/knowledge/vectordb/selector",
    method: "get"
  })
}

/** Embedding模型选择器 */
export function getEmbedModelSelectorApi() {
  return request<ApiResponseData<Knowledge.SelectorItem[]>>({
    url: "ai/knowledge/embed-model/selector",
    method: "get"
  })
}

/** 增 */
export function createKnowledgeApi(data: Knowledge.CreateKnowledgeRequestData) {
  return request({
    url: "ai/knowledge",
    method: "post",
    data
  })
}

/** 改 */
export function updateKnowledgeApi(data: Knowledge.UpdateKnowledgeRequestData) {
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
