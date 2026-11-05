/**
 * 模型 API（mock 实现）
 *
 * 原实现通过 hook-fetch 调用 /system/model/modelList 接口；
 * 接入真实后端时只需重写本文件内部实现。
 */
import type { GetSessionListVO } from "./types"

const mockModels: GetSessionListVO[] = [
  { id: 1, modelName: "mock-gpt-4o", remark: "模拟模型：通用对话（mock）" },
  { id: 2, modelName: "mock-deepseek-r1", remark: "模拟模型：深度思考（mock），回复内容会先输出思考链" },
  { id: 3, modelName: "mock-qwen-max", remark: "模拟模型：通义千问（mock）" }
]

/** 获取当前用户的模型列表 */
export async function getModelList(): Promise<{ data: GetSessionListVO[] }> {
  return { data: mockModels }
}
