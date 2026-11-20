import type * as Doc from "./type"
import type { DictionaryResponseData } from "@/common/apis/dict/type"
import { request } from "@/http/axios"

/** 知识库选择器 */
export function getKnowledgeSelectorApi() {
  return request<DictionaryResponseData>({
    url: "ai/knowledge/selector",
    method: "get"
  })
}

/** 文档分页（含 chunk_count、parse_status） */
export function getDocPageApi(params: Doc.DocTableRequestData) {
  return request<Doc.DocTableResponseData>({
    url: "ai/knowledge/doc",
    method: "get",
    params
  })
}

/** 上传文档（异步解析，返回即成功） */
export function uploadDocApi(data: FormData) {
  return request({
    url: "ai/knowledge/doc",
    method: "post",
    data,
    headers: { "Content-Type": "multipart/form-data" }
  })
}

/** 更新文档（替换文件并重走异步解析，旧向量与分块同步清理） */
export function updateDocApi(data: FormData) {
  return request({
    url: "ai/knowledge/doc",
    method: "put",
    data,
    headers: { "Content-Type": "multipart/form-data" }
  })
}

/** 下载原始文件（文件流） */
export function downloadDocApi(docId: number) {
  return request<Blob>({
    url: "ai/knowledge/doc/download",
    method: "get",
    params: { docId },
    responseType: "blob",
    timeout: 60000
  })
}

/** 分块分页查看（按 id 升序，即文档顺序） */
export function getChunkPageApi(params: Doc.ChunkTableRequestData) {
  return request<Doc.ChunkTableResponseData>({
    url: "ai/knowledge/doc/chunk",
    method: "get",
    params
  })
}

/** 编辑分块（改 DB 后同步重新向量化） */
export function updateChunkApi(data: Doc.UpdateChunkRequestData) {
  return request({
    url: "ai/knowledge/doc/chunk",
    method: "put",
    data
  })
}

/** 删除分块（先删向量库记录再删 DB） */
export function deleteChunkApi(chunkId: number) {
  return request({
    url: `ai/knowledge/doc/chunk/${chunkId}`,
    method: "delete"
  })
}

/** 重新解析（删旧向量+旧分块后重走流水线） */
export function reparseDocApi(docId: number) {
  return request({
    url: `ai/knowledge/doc/reparse/${docId}`,
    method: "post"
  })
}

/** 删除文档（级联删除向量库数据与分块） */
export function deleteDocApi(docId: number) {
  return request({
    url: `ai/knowledge/doc/${docId}`,
    method: "delete"
  })
}
