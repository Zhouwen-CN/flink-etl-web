import type * as User from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: FormData) {
  return request({
    url: "etl/jar",
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `etl/jar/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "etl/jar",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: FormData) {
  return request({
    url: "etl/jar",
    method: "put",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "etl/jar",
    method: "get",
    params
  })
}
