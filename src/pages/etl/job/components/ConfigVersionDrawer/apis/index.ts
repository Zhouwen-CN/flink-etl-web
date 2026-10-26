import type * as User from "./type"
import { request } from "@/http/axios"

/** 配置版本列表 */
export function getConfigVersionListApi(params: User.ConfigVersionRequestData) {
  return request<ApiResponseData<User.ConfigVersionData[]>>({
    url: "job/config/version",
    method: "get",
    params
  })
}

/** 配置回滚 */
export function rollbackConfigApi(data: User.ConfigRollbackRequestData) {
  return request({
    url: "job/config/rollback",
    method: "put",
    data
  })
}
