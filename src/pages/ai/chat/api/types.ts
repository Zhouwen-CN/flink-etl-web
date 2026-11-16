/**
 * 聊天模块 API 类型定义（对接 flink-etl-api 后端 AiChatController / AiModelController）
 */

/** 后端统一响应结构 ResponseVO */
export interface ResponseVO<T = unknown> {
  success: boolean
  code: number
  data: T
  message: string | null
}

/** 后端分页响应结构 PageVO */
export interface PageVO<T = unknown> {
  list: T[]
  total: number
}

// ============================== 会话 ==============================

/** AiConversationVO，会话视图对象 */
export interface ConversationVO {
  id: number
  botId: number
  title: string
}

/** AiConversationCreateForm，新增会话表单 */
export interface CreateConversationDTO {
  botId: number
  message: string
}

// ============================== Bot ==============================

/** DictionaryVO，Bot 选择器项（label 为展示名，value 为 Bot ID） */
export interface BotOptionVO {
  label: string
  value: number
}

// ============================== 消息 ==============================

/** 用户消息内容块 */
export interface UserMessageContent {
  text: string
  type: "TEXT"
}

/** 用户消息（历史记录），如 {"contents":[{"text":"你好","type":"TEXT"}],"type":"USER"} */
export interface UserMessage {
  contents: UserMessageContent[]
  type: "USER"
}

/** AI 消息（历史记录 / SSE delta 数据） */
export interface AiMessageVO {
  text?: string
  thinking?: string
  toolExecutionRequests?: unknown[]
  attributes?: Record<string, unknown>
  type: "AI"
}

/** SSE done 事件的 attributes */
export interface DoneAttributes {
  rawMessage?: string
  inputToken?: number
  outputToken?: number
  totalToken?: number
}

/** 历史消息（用户 / AI） */
export type ChatMessage = UserMessage | AiMessageVO

// ============================== 聊天请求 ==============================

/** AiChatForm，聊天（SSE 流式）请求体 */
export interface ChatStreamDTO {
  botId: number
  conversationId: number
  message: string
  /** 图片列表（base64，支持 data:image/png;base64,xxx 格式） */
  images?: string[]
}

/** SSE 流式回调 */
export interface ChatStreamCallbacks {
  onThinking?: (text: string) => void
  onText?: (text: string) => void
  onDone?: (attributes: DoneAttributes) => void
  onError?: (message: string) => void
}
