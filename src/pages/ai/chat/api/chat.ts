/**
 * 聊天消息 API（mock 实现）
 *
 * 接入真实后端时只需重写本文件内部实现（例如改用 hook-fetch 的
 * sseTextDecoderPlugin 或原生 fetch + ReadableStream 解析 SSE），
 * 保持 send / getChatList 的签名不变，组件层零改动。
 */
import type { ChatMessageVo, GetChatListParams, SendDTO } from "./types"

/** 模拟 SSE 数据块，结构与 OpenAI 流式返回对齐 */
export interface SseChunk {
  result: {
    choices: Array<{
      delta: {
        content?: string
        reasoning_content?: string
      }
    }>
  }
}

/** 内存中的消息存储（仅 mock 用，刷新后清空） */
const messageMap = new Map<string, ChatMessageVo[]>()
let messageId = 1

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }, { once: true })
  })
}

/**
 * 发送消息（模拟 SSE 流式响应）
 *
 * 原实现：hook-fetch 的 post("/chat/send", data) + sseTextDecoderPlugin，
 * 组件内通过 useHookFetch 消费。
 * 当前 mock：返回可中止的异步迭代器，先产出思考链（reasoning_content），
 * 再产出 markdown 正文（content）。
 */
export async function* send(data: SendDTO, signal?: AbortSignal): AsyncGenerator<SseChunk> {
  const userMessage = [...data.messages].reverse().find(m => m.role === "user")?.content ?? ""
  const sessionId = data.sessionId ?? ""

  // 记录用户消息
  const list = messageMap.get(sessionId) ?? []
  list.push({
    id: messageId++,
    content: userMessage,
    role: "user",
    sessionId: sessionId ? Number(sessionId) : undefined,
    userId: data.userId,
    modelName: data.model
  })

  // 模拟思考链
  const reasoning = `用户提问：「${userMessage.slice(0, 40)}」。当前为 mock 模式，我需要组织一段包含标题、列表与代码块的 Markdown 回复来演示流式渲染效果。`
  const reasoningChunks = reasoning.match(/.{1,6}/g) ?? []
  for (const chunk of reasoningChunks) {
    await sleep(30, signal)
    yield { result: { choices: [{ delta: { reasoning_content: chunk } }] } }
  }

  // 模拟正文
  const reply = [
    `### 回复示例`,
    ``,
    `你发送的内容是：**${userMessage.slice(0, 60) || "（空）"}**`,
    ``,
    `当前处于 **mock 模式**，未连接真实 AI 后端。后续接入真实后端时，只需替换 \`src/pages/ai/chat/api/chat.ts\` 的实现。`,
    ``,
    `代码块示例：`,
    ``,
    "```ts",
    `export function greet(name: string) {`,
    `  return \`你好，\${name}！\``,
    `}`,
    "```",
    ``,
    `- 列表项一`,
    `- 列表项二`,
    `- 列表项三`
  ].join("\n")
  const contentChunks = reply.match(/[\s\S]{1,8}/g) ?? []
  let fullContent = ""
  for (const chunk of contentChunks) {
    await sleep(40, signal)
    fullContent += chunk
    yield { result: { choices: [{ delta: { content: chunk } }] } }
  }

  // 记录 AI 消息
  list.push({
    id: messageId++,
    content: fullContent,
    role: "assistant",
    sessionId: sessionId ? Number(sessionId) : undefined,
    userId: data.userId,
    modelName: data.model
  })
  messageMap.set(sessionId, list)
}

/** 获取当前会话的聊天记录 */
export async function getChatList(params: GetChatListParams): Promise<{ rows: ChatMessageVo[] }> {
  const sessionId = `${params.sessionId ?? ""}`
  return { rows: messageMap.get(sessionId) ?? [] }
}
