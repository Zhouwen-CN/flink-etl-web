import type * as Tables from "./type"
import { request } from "@/http/axios"

/** 查 */
export function getTableDataApi(params: Tables.TableRequestData) {
  return request<Tables.TableResponseData>({
    url: "log/login",
    method: "get",
    params
  })
}
