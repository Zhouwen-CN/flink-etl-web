import type * as Tables from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 查 */
export function getTableDataApi(params: Tables.TableRequestData) {
  return request<Tables.TableResponseData>({
    url: "instance",
    method: "get",
    params
  })
}

/** 查集群选择器数据 */
export function getClusterSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "instance/cluster/selector",
    method: "get"
  })
}

/** 查任务选择器数据 */
export function getJobSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "instance/job/selector",
    method: "get"
  })
}

/** 查状态选择器数据 */
export function getStatusSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "instance/status/selector",
    method: "get"
  })
}

/** 查jar选择器数据 */
export function getJarSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "instance/jar/selector",
    method: "get"
  })
}

/** 停止任务 */
export function getStopjobDataApi(instanceId: string) {
  return request({
    url: `instance/job/cancel/${instanceId}`,
    method: "put"
  })
}

/** 删除任务实例 */
export function deleteJobInstanceDataApi(id: string) {
  return request({
    url: `instance/${id}`,
    method: "delete"
  })
}
