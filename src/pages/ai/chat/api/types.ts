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

/** 用户消息文本内容块 */
export interface UserTextContent {
  text: string
  type: "TEXT"
}

/** 用户消息图片内容块，如 {"image":{"base64Data":"xxx","mimeType":"image/png"},"type":"IMAGE"} */
export interface UserImageContent {
  image: {
    base64Data: string
    mimeType: string
  }
  detailLevel?: "LOW" | "HIGH" | "AUTO"
  type: "IMAGE"
}

/** 用户消息内容块（文本 / 图片） */
export type UserMessageContent = UserTextContent | UserImageContent

/** 用户消息（历史记录），如 {"contents":[{"text":"你好","type":"TEXT"}],"type":"USER"} */
export interface UserMessage {
  contents: UserMessageContent[]
  type: "USER"
}

/** AI 发起的工具调用请求，如 {"id":"chatcmpl-tool-xxx","name":"add","arguments":"{\"a\": 1, \"b\": 2}"} */
export interface ToolExecutionRequest {
  id: string
  name: string
  /** 原始 JSON 参数字符串 */
  arguments: string
}

/** 工具执行结果消息，如 {"id":"chatcmpl-tool-xxx","toolName":"add","contents":[{"text":"3","type":"TEXT"}],"isError":false,"type":"TOOL_EXECUTION_RESULT"} */
export interface ToolExecutionResult {
  id: string
  toolName: string
  contents: { text: string, type: "TEXT" }[]
  isError?: boolean
  attributes?: Record<string, unknown>
  type: "TOOL_EXECUTION_RESULT"
}

/** AI 消息（历史记录 / SSE delta 数据） */
export interface AiMessageVO {
  text?: string
  thinking?: string
  toolExecutionRequests?: ToolExecutionRequest[]
  attributes?: Record<string, unknown>
  type: "AI"
}

/** 系统消息（历史记录中可能出现，前端不渲染） */
export interface SystemMessage {
  text?: string
  attributes?: Record<string, unknown>
  type: "SYSTEM"
}

/** token 用量统计 */
export interface TokenUsage {
  inputToken?: number
  outputToken?: number
  totalToken?: number
  /** 所属模型的上下文窗口（token 数） */
  contextWindow?: number
}

/** 引用检索内容（联网搜索 / RAG 引用来源） */
export interface RetrievalContent {
  number: number
  title: string
  content?: string
  url?: string
}

/** SSE done 事件 / 历史 AI 消息的 attributes */
export interface DoneAttributes {
  tokenUsage?: TokenUsage
  retrievalContent?: RetrievalContent[]
}

/** 历史消息（用户 / AI / 工具执行结果 / 系统消息） */
export type ChatMessage = UserMessage | AiMessageVO | ToolExecutionResult | SystemMessage

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
  /** tool 事件：AI 发起工具调用（含该轮 thinking 与 toolExecutionRequests） */
  onToolRequest?: (message: AiMessageVO) => void
  /** tool 事件：工具执行结果 */
  onToolResult?: (result: ToolExecutionResult) => void
  onDone?: (attributes: DoneAttributes) => void
  onError?: (message: string) => void
}
