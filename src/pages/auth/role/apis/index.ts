import type * as Role from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: Role.CreateOrUpdateTableRequestData) {
  return request({
    url: "role",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `role/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: Role.DeleteBatchTableRequestData) {
  return request({
    url: "role",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: Role.CreateOrUpdateTableRequestData) {
  return request({
    url: "role",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: Role.TableRequestData) {
  return request<Role.TableResponseData>({
    url: "role",
    method: "get",
    params
  })
}

/** 获取权限选择器 */
export function getPermissionSelectorApi() {
  return request<Role.PermissionSelectorResponseData>({
    url: "role/permission/selector",
    method: "get"
  })
}

/** 获取权限ID列表 */
export function getPermissionIdsApi(id: number) {
  return request<Role.PermissionIdsResponseData>({
    url: `role/permission/${id}`,
    method: "get"
  })
}
