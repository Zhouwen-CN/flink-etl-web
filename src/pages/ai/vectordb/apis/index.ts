import type * as VectorDatabase from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createVectorDatabaseApi(data: VectorDatabase.CreateOrUpdateVectorDatabaseRequestData) {
  return request({
    url: "ai/vectordb",
    method: "post",
    data
  })
}

/** 删 */
export function deleteVectorDatabaseApi(id: number) {
  return request({
    url: `ai/vectordb/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateVectorDatabaseApi(data: VectorDatabase.CreateOrUpdateVectorDatabaseRequestData) {
  return request({
    url: "ai/vectordb",
    method: "put",
    data
  })
}

/** 查（分页） */
export function getVectorDatabasePageApi(params: VectorDatabase.TableRequestData) {
  return request<VectorDatabase.TableResponseData>({
    url: "ai/vectordb",
    method: "get",
    params
  })
}

/** 连接验证（支持未保存配置，只读探测无写副作用） */
export function verifyVectorDatabaseApi(data: VectorDatabase.VerifyVectorDatabaseRequestData) {
  return request({
    url: "ai/vectordb/verify",
    method: "post",
    data
  })
}
