import type * as Permission from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: Permission.CreateOrUpdateTableRequestData) {
  return request({
    url: "sys/permission",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `sys/permission/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: Permission.DeleteBatchTableRequestData) {
  return request({
    url: "sys/permission",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: Permission.CreateOrUpdateTableRequestData) {
  return request({
    url: "sys/permission",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: Permission.TableRequestData) {
  return request<Permission.TableResponseData>({
    url: "sys/permission",
    method: "get",
    params
  })
}
