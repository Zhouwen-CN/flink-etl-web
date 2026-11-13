import type * as User from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/schedule",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `etl/schedule/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "etl/schedule",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/schedule",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "etl/schedule",
    method: "get",
    params
  })
}

/** 查ETL任务选择器 */
export function getEtlJobSelectorDataApi() {
  return request<DictionaryResponseData>({
    url: "etl/schedule/job/selector",
    method: "get"
  })
}

/** 启动/停止 */
export function changeStatusTableDataApi(data: User.ChangeStatusRequestData) {
  return request({
    url: "etl/schedule",
    method: "patch",
    data
  })
}
