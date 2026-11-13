import type * as User from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/cluster",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `etl/cluster/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "etl/cluster",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/cluster",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "etl/cluster",
    method: "get",
    params
  })
}
