import type * as User from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "user",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `user/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "user",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "user",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "user",
    method: "get",
    params
  })
}

/** 查询用户角色ID列表 */
export function getRoleIdsDataApi(userId: number) {
  return request<User.RoleIdsResponseData>({
    url: `user/role/${userId}`,
    method: "get"
  })
}

/** 查角色选择器  */
export function getRoleSelectorDataApi() {
  return request<User.RoleSelectorResponseData>({
    url: "user/role/selector",
    method: "get"
  })
}
