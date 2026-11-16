import type {
  AiMessageVO,
  BotOptionVO,
  ChatMessage,
  ChatStreamCallbacks,
  ChatStreamDTO,
  ConversationVO,
  CreateConversationDTO,
  DoneAttributes,
  ResponseVO,
  ToolExecutionResult
} from "./types"
/**
 * AI 聊天模块 API（对接 flink-etl-api 后端 AiChatController）
 *
 * 包含：会话管理、Bot 选择器、聊天 SSE 流式接口
 */
import { getToken } from "@@/utils/local-storage"
import { logout, request } from "@/http/axios"

// ============================== 会话 ==============================

/** 查询会话列表 */
export function getConversationListApi() {
  return request<ResponseVO<ConversationVO[]>>({ url: "/ai/chat/conversation", method: "get" })
    .then(res => res.data)
}

/**
 * 查询会话消息列表（后端按 id 倒序返回消息 JSON 字符串数组
 */
export function getConversationMessageListApi(conversationId: number) {
  return request<ResponseVO<string[]>>({
    url: "/ai/chat/conversation/message",
    method: "get",
    params: { conversationId }
  }).then(res => res.data.map(item => JSON.parse(item) as ChatMessage))
}

/** 新增会话，返回新会话信息 */
export function createConversationApi(data: CreateConversationDTO) {
  return request<ResponseVO<ConversationVO>>({ url: "/ai/chat/conversation", method: "post", data })
    .then(res => res.data)
}

/** 删除会话（含会话消息） */
export function deleteConversationApi(id: number | string) {
  return request<ResponseVO<null>>({ url: `/ai/chat/conversation/${id}`, method: "delete" })
}

/** 会话重命名 */
export function renameConversationApi(id: number | string, title: string) {
  return request<ResponseVO<null>>({ url: "/ai/chat/conversation", method: "patch", data: { id, title } })
}

// ============================== Bot ==============================

/** Bot 选择器 */
export function getBotListApi() {
  return request<ResponseVO<BotOptionVO[]>>({ url: "/ai/chat/bot/selector", method: "get" })
    .then(res => res.data)
}

// ============================== 聊天 SSE ==============================

/** 解析单个 SSE 事件块并分发到回调 */
function handleBlock(block: string, callbacks: ChatStreamCallbacks) {
  let event = "message"
  const dataLines: string[] = []
  for (const line of block.split("\n")) {
    if (line.startsWith("event:"))
      event = line.slice(6).trim()
    else if (line.startsWith("data:"))
      dataLines.push(line.slice(5).trim())
  }
  const data = dataLines.join("\n")
  if (!data)
    return

  try {
    switch (event) {
      case "delta": {
        const msg = JSON.parse(data) as { text?: string, thinking?: string }
        if (msg.thinking)
          callbacks.onThinking?.(msg.thinking)
        if (msg.text)
          callbacks.onText?.(msg.text)
        break
      }
      case "tool": {
        const msg = JSON.parse(data) as AiMessageVO | ToolExecutionResult
        if (msg.type === "TOOL_EXECUTION_RESULT")
          callbacks.onToolResult?.(msg)
        else if (msg.type === "AI")
          callbacks.onToolRequest?.(msg)
        break
      }
      case "done": {
        const msg = JSON.parse(data) as { attributes?: Record<string, unknown> }
        callbacks.onDone?.((msg.attributes ?? {}) as DoneAttributes)
        break
      }
      case "error": {
        // error 事件的 data 是纯文本错误信息
        callbacks.onError?.(data)
        break
      }
    }
  } catch (err) {
    console.error("解析 SSE 数据失败:", err, data)
  }
}

/**
 * 发送聊天消息并消费 SSE 流式响应（POST /ai/chat/stream）
 *
 * SSE 事件：
 * - delta：AI 消息片段（thinking 或 text 字段）
 * - tool：工具调用（AI 消息含 toolExecutionRequests / 工具执行结果 TOOL_EXECUTION_RESULT）
 * - done：最终元数据（attributes.inputToken / outputToken / totalToken）
 * - error：错误信息（纯文本）
 *
 * 用 fetch + ReadableStream 手动解析（POST 请求无法用 EventSource），
 * 通过 signal 支持中断，中断时 fetch 会以 AbortError reject。
 */
export async function streamChat(data: ChatStreamDTO, callbacks: ChatStreamCallbacks, signal?: AbortSignal): Promise<void> {
  const token = getToken()
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify(data),
    signal
  })

  // 业务异常/未认证时后端返回的是 ResponseVO JSON（HTTP 统一 200，自定义 code），而非 SSE 流，
  // 直接解析出错误信息抛出，避免静默失败
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const vo = JSON.parse(await response.text()) as ResponseVO<unknown>
    // code 401：token 过期/校验失败，与 axios 响应拦截器保持一致，退出登录并跳转登录页
    if (vo.code === 401) {
      logout()
      return
    }
    // code 非 200：抛出后端错误信息
    if (vo.code !== 200)
      throw new Error(vo.message || `聊天请求失败: ${vo.code}`)
  }

  if (!response.ok || !response.body)
    throw new Error(`聊天请求失败: ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    buffer += decoder.decode(value, { stream: true })
    // SSE 事件以空行分隔
    const blocks = buffer.split("\n\n")
    buffer = blocks.pop() ?? ""
    for (const block of blocks) {
      if (block)
        handleBlock(block, callbacks)
    }
  }
}
