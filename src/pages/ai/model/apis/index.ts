import type * as Model from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createModelApi(data: Model.CreateOrUpdateModelRequestData) {
  return request({
    url: "ai/model",
    method: "post",
    data
  })
}

/** 删 */
export function deleteModelApi(id: number) {
  return request({
    url: `ai/model/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateModelApi(data: Model.CreateOrUpdateModelRequestData) {
  return request({
    url: "ai/model",
    method: "put",
    data
  })
}

/** 查（分页） */
export function getModelPageApi(params: Model.TableRequestData) {
  return request<Model.TableResponseData>({
    url: "ai/model",
    method: "get",
    params
  })
}

/** 测试连通性 */
export function testModelApi(modelId: number) {
  return request<Model.TestResponseData>({
    url: "ai/model/test",
    method: "get",
    params: { modelId }
  })
}
