import type * as User from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 运行任务 */
export function getRunJobDataApi(data: User.RunJobResponseData) {
  return request({
    url: "job/run",
    method: "post",
    data
  })
}

/** 获取任务实例选择器 */
export function getJobInstanceSelectorDataAPi(id: number) {
  return request<DictionaryResponseData>({
    url: `job/instance/selector/${id}`,
    method: "get"
  })
}

/** 获取检查点选择器 */
export function getCheckpointSelectorDataApi(params: User.CheckpointSelectorRequestData) {
  return request<DictionaryResponseData>({
    url: `job/checkpoint/selector`,
    method: "get",
    params
  })
}
