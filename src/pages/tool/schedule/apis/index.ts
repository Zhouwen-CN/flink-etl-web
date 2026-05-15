import type * as User from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "schedule",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `schedule/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "schedule",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "schedule",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "schedule",
    method: "get",
    params
  })
}

/** 查ETL任务选择器 */
export function getEtlJobSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "schedule/job/selector",
    method: "get"
  })
}

/** 启动/停止 */
export function changeStatusTableDataApi(data: User.ChangeStatusRequestData) {
  return request({
    url: "schedule",
    method: "patch",
    data
  })
}
