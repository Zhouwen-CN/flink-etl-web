import type * as User from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "alert",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `alert/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "alert",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "alert",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "alert",
    method: "get",
    params
  })
}

/** 获取告警任务选择器数据 */
export function getJobSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "alert/job/selector",
    method: "get"
  })
}

/** 获取告警任务ID列表 */
export function getJobIdsDataApi(id: number) {
  return request<ApiResponseData<number[]>>({
    url: `alert/job/${id}`,
    method: "get"
  })
}

/** 测试发送邮件 */
export function testSendEmailDataApi(id: number) {
  return request<ApiResponseData<number[]>>({
    url: `alert/test/${id}`,
    method: "get"
  })
}
