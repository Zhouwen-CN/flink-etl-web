import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "sys/user/info",
    method: "get"
  })
}

/** 退出登入 */
export function logoutApi(id: number) {
  return request({
    url: `sys/auth/logout/${id}`,
    method: "get"
  })
}

/** 修改密码 */
export function updatePasswordApi(data: Users.UpdatePasswordRequestData) {
  return request({
    url: "sys/user/pwd/change",
    method: "patch",
    data
  })
}
