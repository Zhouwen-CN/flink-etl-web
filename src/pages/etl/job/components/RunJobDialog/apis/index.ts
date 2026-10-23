import type * as User from "./type"
import { request } from "@/http/axios"

/** 运行任务 */
export function getRunJobDataApi(data: User.RunJobResponseData) {
  return request({
    url: "job/run",
    method: "post",
    data
  })
}

/** 获取检查点选择器 */
export function getCheckpointSelectorDataApi(params: User.CheckpointSelectorRequestData) {
  return request<ApiResponseData<User.CheckpointSelectorData[]>>({
    url: `job/checkpoint/selector`,
    method: "get",
    params
  })
}
