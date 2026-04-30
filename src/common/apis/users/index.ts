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
  return request<Users.LogoutResponseData>({
    url: `auth/logout/${id}`,
    method: "get"
  })
}
