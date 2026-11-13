import type * as User from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "sys/user",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `sys/user/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "sys/user",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "sys/user",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "sys/user",
    method: "get",
    params
  })
}

/** 查询用户角色ID列表 */
export function getRoleIdsDataApi(userId: number) {
  return request<User.RoleIdsResponseData>({
    url: `sys/user/role/${userId}`,
    method: "get"
  })
}

/** 查部门选择器（树形） */
export function getDeptSelectorDataApi() {
  return request<User.DeptSelectorResponseData>({
    url: "sys/user/dept/selector",
    method: "get"
  })
}

/** 查角色选择器  */
export function getRoleSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "sys/user/role/selector",
    method: "get"
  })
}

/** 重置密码 */
export function resetPasswordApi(id: number) {
  return request({
    url: `sys/user/pwd/reset/${id}`,
    method: "patch"
  })
}

/** 下线用户 */
export function revokeUserApi(id: number) {
  return request({
    url: `sys/auth/revoke/${id}`,
    method: "get"
  })
}
