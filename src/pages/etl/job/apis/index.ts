import type * as User from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/job",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `etl/job/${id}`,
    method: "delete"
  })
}

/** 批量删 */
export function deleteBatchTableDataApi(params: User.DeleteBatchTableRequestData) {
  return request({
    url: "etl/job",
    method: "delete",
    params
  })
}

/** 改 */
export function updateTableDataApi(data: User.CreateOrUpdateTableRequestData) {
  return request({
    url: "etl/job",
    method: "put",
    data
  })
}

/** 查 */
export function getTableDataApi(params: User.TableRequestData) {
  return request<User.TableResponseData>({
    url: "etl/job",
    method: "get",
    params
  })
}

/** 查集群选择器数据 */
export function getClusterSelectorDataApi() {
  return request<User.ClusterSelectorDataResponseData>({
    url: "etl/job/cluster/selector",
    method: "get"
  })
}

/** 查jar包选择器数据 */
export function getJarSelectorDataApi() {
  return request<User.JarSelectorDataResponseData>({
    url: "etl/job/jar/selector",
    method: "get"
  })
}
