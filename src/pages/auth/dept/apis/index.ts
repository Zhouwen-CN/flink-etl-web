import type * as Dept from "./type"
import { request } from "@/http/axios"

/** 增 */
export function createTableDataApi(data: Dept.CreateOrUpdateTableRequestData) {
  return request({
    url: "dept",
    method: "post",
    data
  })
}

/** 删 */
export function deleteTableDataApi(id: number) {
  return request({
    url: `dept/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateTableDataApi(data: Dept.CreateOrUpdateTableRequestData) {
  return request({
    url: "dept",
    method: "put",
    data
  })
}

/** 查：部门树 */
export function getTableDataApi(params?: Dept.GetTableRequestData) {
  return request<Dept.TableResponseData>({
    url: "dept/tree",
    method: "get",
    params: { name: params?.name ?? undefined }
  })
}
