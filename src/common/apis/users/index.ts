import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "user/info",
    method: "get"
  })
}

/** 退出登入 */
export function logoutApi(id: number) {
  return request({
    url: `auth/logout/${id}`,
    method: "get"
  })
}

/** 修改密码 */
export function updatePasswordApi(data: Users.UpdatePasswordRequestData) {
  return request({
    url: "user/pwd/change",
    method: "patch",
    data
  })
}
