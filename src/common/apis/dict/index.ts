import type { DictionaryResponseData } from "./type"
import { request } from "@/http/axios"

export function getDictionaryDataApi(dictTypeName: string) {
  return request<DictionaryResponseData>({
    url: "dict/data/selector",
    method: "get",
    params: {
      name: dictTypeName
    }
  })
}
