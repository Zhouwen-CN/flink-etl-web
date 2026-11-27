<!-- AI Chat 页面 -->
<script setup lang="ts">
import type { BubbleProps } from "vue-element-plus-x/types/Bubble"
import type { BubbleListInstance } from "vue-element-plus-x/types/BubbleList"
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import type { ThinkingStatus } from "vue-element-plus-x/types/Thinking"
import type { AiMessageVO, BotOptionVO, ChatMessage, DoneAttributes, RetrievalContent, TokenUsage, ToolExecutionRequest, ToolExecutionResult, UserImageContent } from "./api/types"
import aiAvatar from "@@/assets/images/avatar/ai_avatar.gif?url"
import userAvatar from "@@/assets/images/avatar/user_avatar.png?url"
import { useTheme } from "@@/composables/useTheme"
import { Tools } from "@element-plus/icons-vue"
import { computed, nextTick, ref, watch } from "vue"
import { Attachments, BubbleList, Sender, Thinking, XMarkdown } from "vue-element-plus-x"
import { useRoute, useRouter } from "vue-router"
import { createConversationApi, getConversationMessageListApi, streamChat } from "./api"
import BotSelect from "./components/BotSelect/index.vue"
import FilesSelect from "./components/FilesSelect/index.vue"
import SessionSidebar from "./components/SessionSidebar/index.vue"

import WelecomeText from "./components/WelecomeText/index.vue"
import { usePasteFiles } from "./hooks/usePasteFiles"

/* eslint-disable vue/component-definition-name-casing */
defineOptions({ name: "chat" })

/** 思考链内容片段：思考文本 / 工具调用记录（可折叠卡片） */
interface ThinkingTextPart { kind: "text", text: string }
interface ThinkingToolPart { kind: "tool", id: string, name: string, arguments: string, result?: string, isError?: boolean }
type ThinkingPart = ThinkingTextPart | ThinkingToolPart

type MessageItem = BubbleProps & {
  key: number
  role: "ai" | "user"
  avatar: string
  thinkingStatus?: ThinkingStatus
  thinlCollapse?: boolean
  /** 思考链内容片段（思考文本 + 工具调用，按发生顺序排列） */
  thinkingParts?: ThinkingPart[]
  /** token 用量统计（来自 done 事件 / 历史 AI 消息 attributes） */
  tokenUsage?: TokenUsage
  /** 引用检索内容（来自 done 事件 / 历史 AI 消息 attributes） */
  retrievalContent?: RetrievalContent[]
  /** 用户消息携带的图片（data URL） */
  images?: string[]
}

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => route.query?.sessionId)

// ============================== 附件（原 files store 下沉到本组件） ==============================

type ChatFileItem = FilesCardProps & {
  file: File
}

const filesList = ref<ChatFileItem[]>([])

// crypto.randomUUID 仅在安全上下文（HTTPS/localhost）可用，HTTP 部署时需降级生成
function genUid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID()
  return `uid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// 把原生 File 转成附件卡片项，追加到列表（选择文件、粘贴截图都走这里）
// 暂时仅支持图片附件
function addFiles(files: File[]) {
  const images = files.filter(file => file.type.startsWith("image/"))
  if (images.length < files.length)
    ElMessage.warning("暂时仅支持图片附件")
  if (!images.length)
    return
  const items = images.map(file =>
    ({
      uid: genUid(), // 不写 uid，文件列表展示不出来，elx 1.2.0 bug 待修复
      name: file.name,
      fileSize: file.size,
      file,
      maxWidth: "200px",
      showDelIcon: true, // 显示删除图标
      imgPreview: true, // 显示图片预览
      imgVariant: "square", // 图片预览的形状
      url: URL.createObjectURL(file) // 图片预览地址
    }) as ChatFileItem
  )
  filesList.value.push(...items)
}

// 根据索引删除附件，并回收图片预览地址
function deleteFileByIndex(index: number) {
  const item = filesList.value[index]
  if (item?.url)
    URL.revokeObjectURL(item.url)
  filesList.value.splice(index, 1)
}

// 粘贴截图/图片自动加入附件
const { handlePaste } = usePasteFiles(addFiles)

// ============================== 会话列表 / 模型（原 chat store 下沉） ==============================

// 会话侧栏组件引用：创建会话后调用其 refresh() 刷新会话列表
const sidebarRef = ref<InstanceType<typeof SessionSidebar> | null>(null)

// 当前选中的 Bot
const currentBot = ref<BotOptionVO | null>(null)

// Bot 选择器组件引用：打开会话时根据会话的 botId 同步选中 Bot
const botSelectRef = ref<InstanceType<typeof BotSelect> | null>(null)

// 代码块主题跟随当前项目主题（黑暗/深蓝 → dark，默认 → light）
// XMarkdown 通过 default-theme-mode 切换 body.dark 并同步 shiki 高亮主题
const { activeThemeName } = useTheme()
const codeThemeMode = computed(() =>
  activeThemeName.value === "dark" || activeThemeName.value === "dark-blue" ? "dark" : "light"
)

const inputValue = ref("")
const senderRef = ref<InstanceType<typeof Sender> | null>(null)
const bubbleItems = ref<MessageItem[]>([])
const bubbleListRef = ref<BubbleListInstance | null>(null)

// 新聊天流程中暂存第一条消息：创建会话 → 跳转 → 会话消息加载完后发送
const pendingMessage = ref("")

// 欢迎页输入框行数更大，会话页更小
const autoSize = computed(() =>
  sessionId.value
    ? { maxRows: 6, minRows: 2 }
    : { maxRows: 9, minRows: 3 }
)

const isLoading = ref(false)
let abortController: AbortController | null = null

// 最近一次已加载历史的会话 id：切回页面时若是同一会话则不重复加载
let lastLoadedSessionId: string | undefined

watch(
  () => route.query?.sessionId,
  async (rawId) => {
    // 路由已切到其他页面（keep-alive 下 watcher 依然活跃）时忽略，保持缓存状态
    if (route.name !== "chat") return

    // query 可能是 string | LocationQueryValue[]，归一化为 string
    const id = rawId as string

    // 返回页面时仍是同一会话且已有数据，不重复加载
    if (id && id === lastLoadedSessionId && bubbleItems.value.length) return

    // 无会话 id：回到欢迎页，清空消息
    if (!id) {
      bubbleItems.value = []
      lastLoadedSessionId = undefined
      return
    }

    // 加载会话历史消息并回显
    try {
      const messages = await getConversationMessageListApi(Number(id))
      bubbleItems.value = mapHistoryMessages(messages)
      lastLoadedSessionId = id
    } catch (error) {
      console.error("getConversationMessageList错误:", error)
      bubbleItems.value = []
    }

    // 滚动到底部
    setTimeout(() => {
      bubbleListRef.value?.scrollToBottom()
    }, 350)

    // 打开已有会话：根据会话的 botId 同步当前选中的 Bot
    syncCurrentBot()

    // 新创建的会话：发送暂存的第一条消息（附件列表里的图片仍属于该条消息，在此一并取出）
    if (pendingMessage.value) {
      const message = pendingMessage.value
      pendingMessage.value = ""
      startSSE(message, await takeImagePayload())
    }
  },
  { immediate: true }
)

// 根据当前会话的 botId，把 Bot 选择器同步到会话对应的 Bot
function syncCurrentBot() {
  const id = sessionId.value
  if (!id)
    return
  const conversations = sidebarRef.value?.sessionList ?? []
  const conversation = conversations.find(item => item.id === Number(id))
  if (!conversation)
    return
  const bot = botSelectRef.value?.botList.find(item => item.value === conversation.botId)
  if (bot)
    currentBot.value = bot
}

// 会话列表异步加载完成后再同步一次（打开页面直达会话时，列表可能晚于 sessionId watch 就绪）
watch(() => sidebarRef.value?.sessionList, syncCurrentBot)

// Sender 统一提交入口：无会话先创建会话（内容由 watch 中 pendingMessage 触发发送），有会话直接 SSE 发送
async function handleSend() {
  const content = inputValue.value
  if (!content.trim())
    return

  if (!route.query?.sessionId) {
    // 开启新聊天：先创建会话（后端要调大模型生成标题，耗时较长，Sender 置为 loading），
    // 拿到会话 id 才能调用 chat 接口
    if (!currentBot.value) {
      ElMessage.warning("请先选择 Bot")
      return
    }
    pendingMessage.value = content
    inputValue.value = ""
    isLoading.value = true
    try {
      const vo = await createConversationApi({ botId: currentBot.value.value, message: content })
      // 刷新侧栏会话列表
      sidebarRef.value?.refresh()
      // 跳转聊天页（query 携带会话id，保持 path 不变，tags-view 只保留一个标签），
      // loading 由 watch 中触发的 startSSE 接管
      router.replace({ name: "chat", query: { sessionId: `${vo.id}` } })
    } catch (error) {
      console.error("createSession错误:", error)
      isLoading.value = false
      pendingMessage.value = ""
      inputValue.value = content
    }
    return
  }
  const images = await takeImagePayload()
  startSSE(content, images)
}

// SSE 流式回调：思考链 / 正文 / 结束 / 错误

/** 向思考链追加思考文本（与相邻文本片段合并，保持片段数量最少） */
function appendThinkingDelta(item: MessageItem, text: string) {
  const parts = (item.thinkingParts ??= [])
  const lastPart = parts[parts.length - 1]
  if (lastPart?.kind === "text")
    lastPart.text += text
  else
    parts.push({ kind: "text", text })
}

/** 追加整段思考文本（tool 事件携带整轮完整 thinking，delta 已流式输出的不重复追加） */
function appendThinkingFull(item: MessageItem, text: string) {
  if (!text)
    return
  const joined = (item.thinkingParts ?? []).filter(part => part.kind === "text").map(part => part.text).join("")
  if (!joined.includes(text))
    appendThinkingDelta(item, text)
}

/** 向思考链追加工具调用请求（可折叠卡片） */
function addToolRequests(item: MessageItem, requests?: ToolExecutionRequest[]) {
  const parts = (item.thinkingParts ??= [])
  for (const req of requests ?? [])
    parts.push({ kind: "tool", id: req.id, name: req.name, arguments: req.arguments })
}

/** 按工具调用 id 回填执行结果 */
function setToolResult(item: MessageItem, result: ToolExecutionResult) {
  const parts = item.thinkingParts ?? []
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (part.kind === "tool" && part.id === result.id && part.result === undefined) {
      part.result = (result.contents ?? []).filter(content => content.type === "TEXT").map(content => content.text).join("")
      part.isError = result.isError
      return
    }
  }
}

function handleThinkingChunk(text: string) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  last.thinkingStatus = "thinking"
  last.loading = true
  last.thinlCollapse = true
  appendThinkingDelta(last, text)
}

/** SSE tool 事件：AI 发起工具调用，记录到思考链（可折叠展示） */
function handleToolRequest(message: AiMessageVO) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  last.thinkingStatus = "thinking"
  last.loading = true
  last.thinlCollapse = true
  appendThinkingFull(last, message.thinking ?? "")
  addToolRequests(last, message.toolExecutionRequests)
}

/** SSE tool 事件：工具执行结果 */
function handleToolResult(result: ToolExecutionResult) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  setToolResult(last, result)
}

/** Thinking 组件 content prop：思考文本汇总（content-wrapper 的渲染条件，实际渲染由 #content 插槽接管） */
function thinkingContent(item: MessageItem): string {
  return (item.thinkingParts ?? [])
    .filter(part => part.kind === "text")
    .map(part => part.text)
    .join("") || " "
}

/** 工具调用参数/结果展示：是 JSON 则格式化缩进，否则原样输出 */
function formatToolContent(content?: string): string {
  if (content === undefined)
    return ""
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

function handleTextChunk(text: string) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  last.thinkingStatus = "end"
  last.loading = false
  last.content = (last.content ?? "") + text
}

function finishLastMessage(attributes?: DoneAttributes) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  if (attributes) {
    if (attributes.tokenUsage)
      last.tokenUsage = attributes.tokenUsage
    if (attributes.retrievalContent?.length)
      last.retrievalContent = attributes.retrievalContent
  }
  last.thinkingStatus = "end"
  last.loading = false
  last.typing = false
}

/** 上下文使用百分比（totalToken 相对消息所属模型的上下文窗口） */
function contextPercent(item: MessageItem): number {
  const contextWindow = item.tokenUsage?.contextWindow
  if (!contextWindow) return 0
  return Math.min(100, Math.round(((item.tokenUsage?.totalToken ?? 0) / contextWindow) * 1000) / 10)
}

/** 去除 url 中可能混入的反引号 */
function cleanUrl(url?: string): string {
  return (url ?? "").replace(/`/g, "")
}

/** 引用摘要 tooltip 文本：过长截断，避免 tooltip 过大 */
function truncateContent(content?: string, max = 200): string {
  if (!content)
    return ""
  return content.length > max ? `${content.slice(0, max)}…` : content
}

// ============================== 正文引用下标 hover 卡片 ==============================

/** cite hover 卡片状态：引用数据 + fixed 定位坐标 */
const citationTip = ref<{ refItem: RetrievalContent, x: number, y: number, placement: "top" | "bottom" } | null>(null)

/** 取鼠标事件命中的引用 cite 元素 */
function getCitationEl(e: MouseEvent): HTMLElement | null {
  return (e.target as HTMLElement | null)?.closest?.("cite.md-citation") ?? null
}

/** XMarkdown 渲染内容：正文引用下标 [n] 转成可 hover 的 cite 标签 */
function renderContent(item: MessageItem): string {
  return transformCitations(item.content ?? "", item.retrievalContent)
}

/** 把正文中的引用下标 [n] 替换为 cite 标签（代码块 / 行内代码中不替换，流式未闭合代码块整体跳过） */
function transformCitations(content: string, refs?: RetrievalContent[]): string {
  if (!refs?.length)
    return content
  const numbers = new Set(refs.map(ref => ref.number))
  return content
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/\[(\d+)\]/g, (match, num: string) =>
            numbers.has(Number(num)) ? `<cite class="md-citation" number="${num}">${num}</cite>` : match)
    )
    .join("")
}

/** hover 引用下标：按 number 查引用数据，在元素上方（空间不足时下方）弹出卡片 */
function handleCitationOver(e: MouseEvent, item: MessageItem) {
  const el = getCitationEl(e)
  if (!el)
    return
  const refItem = item.retrievalContent?.find(ref => ref.number === Number(el.getAttribute("number")))
  if (!refItem)
    return
  const rect = el.getBoundingClientRect()
  const placement = rect.top < 180 ? "bottom" : "top"
  citationTip.value = {
    refItem,
    placement,
    x: Math.min(Math.max(rect.left + rect.width / 2, 190), window.innerWidth - 190),
    y: placement === "top" ? rect.top - 8 : rect.bottom + 8
  }
}

function handleCitationOut(e: MouseEvent) {
  const el = getCitationEl(e)
  if (!el)
    return
  // 在同一 cite 内部移动（经过子元素）不隐藏
  const to = e.relatedTarget as HTMLElement | null
  if (to && el.contains(to))
    return
  citationTip.value = null
}

/** 点击引用下标：新窗口打开引用来源 */
function handleCitationClick(e: MouseEvent, item: MessageItem) {
  const el = getCitationEl(e)
  if (!el)
    return
  e.preventDefault()
  const url = item.retrievalContent?.find(ref => ref.number === Number(el.getAttribute("number")))?.url
  if (url)
    window.open(cleanUrl(url), "_blank", "noopener,noreferrer")
}

/** 上下文使用量对应的进度环颜色 */
function contextColor(percentage: number): string {
  if (percentage >= 90) return "var(--el-color-danger)"
  if (percentage >= 70) return "var(--el-color-warning)"
  return "var(--el-color-success)"
}

/** File 转 base64 data URL（data:image/png;base64,xxx） */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** 取出附件列表中的图片并转为 base64 data URL，随后清空附件列表 */
async function takeImagePayload(): Promise<string[]> {
  if (!filesList.value.length)
    return []
  const files = filesList.value.map(item => item.file)
  try {
    return await Promise.all(files.map(fileToDataURL))
  } finally {
    // 无论转换成功与否，都回收预览地址并清空附件列表
    filesList.value.forEach((item) => {
      if (item.url)
        URL.revokeObjectURL(item.url)
    })
    filesList.value = []
  }
}

async function startSSE(chatContent: string, images: string[] = []) {
  if (!currentBot.value) {
    ElMessage.warning("请先选择 Bot")
    return
  }

  // 清空输入框
  inputValue.value = ""
  addMessage(chatContent, true, images)
  addMessage("", false)

  // 这里有必要调用一下 BubbleList 组件的滚动到底部 手动触发 自动滚动
  bubbleListRef.value?.scrollToBottom()

  isLoading.value = true
  abortController = new AbortController()

  try {
    await streamChat(
      {
        botId: currentBot.value.value,
        conversationId: Number(sessionId.value),
        message: chatContent,
        images: images.length ? images : undefined
      },
      {
        onThinking: handleThinkingChunk,
        onText: handleTextChunk,
        onToolRequest: handleToolRequest,
        onToolResult: handleToolResult,
        onDone: attributes => finishLastMessage(attributes),
        onError: (message) => {
          ElMessage.error(message || "聊天服务异常")
          finishLastMessage()
          const last = bubbleItems.value[bubbleItems.value.length - 1]
          if (last)
            last.content = `${last.content ?? ""}\n\n> ⚠️ ${message}`
        }
      },
      abortController.signal
    )
  } catch (err) {
    // 用户主动中断不提示
    if ((err as Error)?.name !== "AbortError") {
      console.error("Fetch error:", err)
      ElMessage.error((err as Error)?.message || "聊天服务异常")
      finishLastMessage()
    }
  } finally {
    isLoading.value = false
    abortController = null
    finishLastMessage()
  }
}

// 中断请求
function cancelSSE() {
  abortController?.abort()
}

/** 把图片内容块转为 data URL（兼容后端直接返回带 data: 前缀的情况） */
function imageToDataUrl(image: UserImageContent["image"]): string {
  if (!image?.base64Data)
    return ""
  return image.base64Data.startsWith("data:")
    ? image.base64Data
    : `data:${image.mimeType || "image/png"};base64,${image.base64Data}`
}

/** 把后端历史消息（USER/AI/工具执行结果 JSON）映射为气泡数据 */
function mapHistoryMessages(messages: ChatMessage[]): MessageItem[] {
  const items: MessageItem[] = []
  for (const message of messages) {
    // 系统消息不渲染
    if (message.type === "SYSTEM")
      continue
    // 工具执行结果：回填到上一条 AI 气泡的思考链
    if (message.type === "TOOL_EXECUTION_RESULT") {
      const last = items[items.length - 1]
      if (last?.role === "ai")
        setToolResult(last, message)
      continue
    }
    if (message.type === "USER") {
      const contents = message.contents ?? []
      const text = contents.filter(item => item.type === "TEXT").map(item => item.text).join("")
      const images = contents
        .filter(item => item.type === "IMAGE")
        .map(item => imageToDataUrl(item.image))
        .filter(Boolean)
      items.push({
        key: items.length,
        avatar: userAvatar,
        avatarSize: "32px",
        role: "user",
        placement: "end",
        content: text,
        images: images.length ? images : undefined,
        noStyle: false
      })
    } else {
      const last = items[items.length - 1]
      // 同一轮的连续 AI 消息（工具调用前的思考 + 最终回复）压缩为一条气泡
      const item: MessageItem = last?.role === "ai"
        ? last
        : {
            key: items.length,
            avatar: aiAvatar,
            avatarSize: "32px",
            role: "ai",
            placement: "start",
            isMarkdown: true,
            content: "",
            thinkingParts: [],
            thinkingStatus: "end",
            thinlCollapse: false,
            noStyle: true
          }
      if (last?.role !== "ai")
        items.push(item)
      if (message.thinking)
        appendThinkingDelta(item, message.thinking)
      addToolRequests(item, message.toolExecutionRequests)
      if (message.text)
        item.content = (item.content ?? "") + message.text
      // attributes：token 用量与引用检索内容（与 done 事件格式一致，取最后一版覆盖）
      const attrs = (message.attributes ?? {}) as DoneAttributes
      if (attrs.tokenUsage)
        item.tokenUsage = attrs.tokenUsage
      if (attrs.retrievalContent?.length)
        item.retrievalContent = attrs.retrievalContent
    }
  }
  return items
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean, images: string[] = []) {
  const obj: MessageItem = {
    key: bubbleItems.value.length,
    avatar: isUser ? userAvatar : aiAvatar,
    avatarSize: "32px",
    role: isUser ? "user" : "ai",
    placement: isUser ? "end" : "start",
    isMarkdown: !isUser,
    loading: !isUser,
    content: message || "",
    images: isUser && images.length ? images : undefined,
    thinkingParts: [],
    thinkingStatus: "start",
    thinlCollapse: false,
    noStyle: !isUser
  }
  bubbleItems.value.push(obj)
}

// 展开收起 事件展示
function handleChange(payload: { value: boolean, status: ThinkingStatus }) {
  console.log("value", payload.value, "status", payload.status)
}

function handleDeleteCard(_item: FilesCardProps, index: number) {
  deleteFileByIndex(index)
}

watch(
  () => filesList.value.length,
  (val) => {
    if (val > 0) {
      nextTick(() => {
        senderRef.value?.openHeader()
      })
    } else {
      nextTick(() => {
        senderRef.value?.closeHeader()
      })
    }
  }
)
</script>

<template>
  <div class="ai-chat-page">
    <SessionSidebar ref="sidebarRef" />
    <div class="chat-container">
      <!-- 固定高度容器：Sender 向上展开时挤压上方消息列表（BubbleList 内部滚动） -->
      <div class="chat-warp" :class="{ 'is-welcome': !sessionId }">
        <WelecomeText v-if="!sessionId" />
        <BubbleList
          v-else
          ref="bubbleListRef"
          :list="bubbleItems"
          max-height="calc(100vh - 240px)"
        >
          <template #header="{ item }">
            <Thinking
              v-if="item.thinkingParts?.length" v-model="item.thinlCollapse"
              :content="thinkingContent(item)"
              :status="item.thinkingStatus" class="thinking-chain-warp"
              @change="handleChange"
            >
              <template #content>
                <div class="thinking-parts">
                  <template v-for="(part, partIndex) in item.thinkingParts" :key="partIndex">
                    <div v-if="part.kind === 'text'" class="thinking-text">
                      {{ part.text }}
                    </div>
                    <el-collapse v-else class="thinking-tools">
                      <el-collapse-item :name="part.id">
                        <template #title>
                          <span class="tool-title" :class="{ 'is-error': part.isError }">
                            <el-icon class="tool-icon">
                              <Tools />
                            </el-icon>
                            {{ part.name }}
                          </span>
                          <el-tag
                            size="small"
                            class="tool-status"
                            :type="part.result === undefined ? 'info' : (part.isError ? 'danger' : 'success')"
                          >
                            {{ part.result === undefined ? "执行中" : (part.isError ? "失败" : "成功") }}
                          </el-tag>
                        </template>
                        <div v-if="part.result !== undefined" class="tool-result">
                          <el-scrollbar max-height="200px">
                            <pre class="tool-block">{{ formatToolContent(part.result) }}</pre>
                          </el-scrollbar>
                        </div>
                        <div v-else class="tool-result">
                          <el-icon class="is-loading">
                            <Loading />
                          </el-icon>
                          执行中...
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </template>
                </div>
              </template>
            </Thinking>
          </template>

          <template #content="{ item }">
            <!-- 引用检索信息（AI 消息）：置于正文上方，可折叠 -->
            <el-collapse v-if="item.role === 'ai' && item.retrievalContent?.length" class="retrieval-collapse">
              <el-collapse-item name="refs">
                <template #title>
                  <span class="retrieval-header">
                    <el-icon><Collection /></el-icon>
                    引用内容 {{ item.retrievalContent.length }} 条
                  </span>
                </template>
                <div v-for="refItem in item.retrievalContent" :key="refItem.number" class="retrieval-item">
                  <el-tooltip
                    :content="truncateContent(refItem.content)"
                    placement="top"
                    :show-after="300"
                    :disabled="!refItem.content"
                    popper-class="retrieval-tooltip"
                  >
                    <a
                      :href="cleanUrl(refItem.url)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="retrieval-link"
                    >
                      <span class="retrieval-number">{{ refItem.number }}</span>
                      <span class="retrieval-title">{{ refItem.title }}</span>
                    </a>
                  </el-tooltip>
                </div>
              </el-collapse-item>
            </el-collapse>
            <!-- chat 内容走 markdown（引用下标 [n] 已转成 cite 标签，hover 展示引用卡片） -->
            <div
              v-if="item.content && item.role === 'ai'"
              class="ai-content"
              @mouseover="handleCitationOver($event, item)"
              @mouseout="handleCitationOut"
              @click="handleCitationClick($event, item)"
            >
              <XMarkdown
                :markdown="renderContent(item)" class="markdown-body" allow-html
                :themes="{ light: 'github-light', dark: 'github-dark' }" :default-theme-mode="codeThemeMode"
              />
            </div>
            <!-- user 内容 纯文本 + 图片 -->
            <template v-if="item.role === 'user'">
              <div v-if="item.content" class="user-content">
                {{ item.content }}
              </div>
              <div v-if="item.images?.length" class="user-images">
                <el-image
                  v-for="(url, imgIndex) in item.images"
                  :key="imgIndex"
                  :src="url"
                  :preview-src-list="item.images"
                  :initial-index="imgIndex"
                  fit="cover"
                  preview-teleported
                  hide-on-click-modal
                  class="user-image"
                />
              </div>
            </template>
          </template>

          <template #footer="{ item }">
            <div v-if="item.role === 'ai' && item.tokenUsage?.totalToken" class="token-info">
              输入 {{ item.tokenUsage.inputToken ?? 0 }} · 输出 {{ item.tokenUsage.outputToken ?? 0 }} · 总计 {{ item.tokenUsage.totalToken }}
              <el-tooltip
                v-if="item.tokenUsage.contextWindow"
                :content="`上下文已用 ${contextPercent(item)}%（${item.tokenUsage.totalToken} / ${item.tokenUsage.contextWindow} tokens）`"
                placement="top"
              >
                <svg class="context-ring" viewBox="0 0 20 20">
                  <circle class="context-ring-track" cx="10" cy="10" r="8" />
                  <circle
                    class="context-ring-bar"
                    cx="10"
                    cy="10"
                    r="8"
                    :stroke="contextColor(contextPercent(item))"
                    :stroke-dasharray="`${(contextPercent(item) / 100) * 2 * Math.PI * 8} 999`"
                  />
                </svg>
              </el-tooltip>
            </div>
          </template>
        </BubbleList>

        <div class="chat-bottom">
          <Sender
            ref="senderRef"
            v-model="inputValue"
            class="chat-sender"
            :auto-size="autoSize"
            variant="updown"
            clearable
            allow-speech
            :loading="isLoading"
            @submit="handleSend"
            @cancel="cancelSSE"
            @paste="handlePaste"
          >
            <template #header>
              <div class="sender-header">
                <Attachments
                  :items="filesList"
                  :hide-upload="true"
                  @delete-card="handleDeleteCard"
                >
                  <template #prev-button="{ show, onScrollLeft }">
                    <div
                      v-if="show"
                      class="prev-next-btn prev-next-btn-left"
                      @click="onScrollLeft"
                    >
                      <el-icon>
                        <ArrowLeftBold />
                      </el-icon>
                    </div>
                  </template>

                  <template #next-button="{ show, onScrollRight }">
                    <div
                      v-if="show"
                      class="prev-next-btn prev-next-btn-right"
                      @click="onScrollRight"
                    >
                      <el-icon>
                        <ArrowRightBold />
                      </el-icon>
                    </div>
                  </template>
                </Attachments>
              </div>
            </template>
            <template #prefix>
              <div class="sender-prefix">
                <FilesSelect @select="addFiles" />
                <BotSelect ref="botSelectRef" v-model="currentBot" />
              </div>
            </template>
          </Sender>
        </div>
      </div>
    </div>

    <!-- 引用下标 hover 卡片（Teleport 到 body，跟随 cite 元素定位） -->
    <Teleport to="body">
      <div
        v-if="citationTip"
        class="citation-popover"
        :class="citationTip.placement === 'top' ? 'is-top' : 'is-bottom'"
        :style="{ left: `${citationTip.x}px`, top: `${citationTip.y}px` }"
      >
        <div class="citation-popover-title">
          {{ citationTip.refItem.number }}. {{ citationTip.refItem.title }}
        </div>
        <div v-if="citationTip.refItem.content" class="citation-popover-content">
          {{ truncateContent(citationTip.refItem.content) }}
        </div>
        <div v-if="citationTip.refItem.url" class="citation-popover-url">
          {{ cleanUrl(citationTip.refItem.url) }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.ai-chat-page {
  position: relative; // 作为侧栏收起浮层与 hover 触发区的定位上下文
  display: flex;
  width: 100%;
  height: calc(100vh - 84px);
  overflow: hidden;
  background-color: var(--el-bg-color-page, #f2f3f5);
}

.chat-container {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 100%;
  padding: 0 16px;
  overflow-anchor: none;
}

// 聊天区主体：会话页固定高度（BubbleList 与 Sender 同处一个 flex 容器，
// Sender 向上展开变高时 BubbleList 被 flex 挤压、内部滚动）；
// 欢迎页高度自适应、整体居中
.chat-warp {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  height: calc(100vh - 120px);

  &.is-welcome {
    justify-content: center;
    height: auto;
    min-height: 450px;
  }

  .thinking-chain-warp {
    margin-bottom: 12px;
  }
}

// 思考链自定义内容（#content 插槽接管渲染，替代库内纯文本 pre），
// 原库内样式挂在 pre 上（背景/圆角/内边距），自定义插槽需自行补齐
.thinking-parts {
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(var(--el-border-radius-base) + 4px);

  .thinking-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  // 工具调用折叠卡片
  .thinking-tools {
    margin: 4px 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .tool-title {
      flex: 1;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      overflow: hidden;
      font-size: 13px;
      color: var(--el-text-color-regular);
      text-overflow: ellipsis;
      white-space: nowrap;

      .tool-icon {
        margin-right: 4px;
        margin-left: 4px;
      }
    }

    .tool-status {
      flex-shrink: 0;
      margin-left: 12px;
    }

    .tool-result {
      padding-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      &.is-error {
        color: var(--el-color-danger);
      }

      .is-loading {
        margin-right: 4px;
        vertical-align: -2px;
      }
    }

    .tool-block {
      margin: 0 0 8px;
      padding: 8px 10px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      line-height: 1.6;
      color: var(--el-text-color-regular);
      background-color: var(--el-fill-color);
      border-radius: 4px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;

      &.is-error {
        color: var(--el-color-danger);
        background-color: var(--el-color-danger-light-9);
      }
    }
  }
}

// 底部区域：Sender 贴在 chat-warp 底部，不被压缩
.chat-bottom {
  flex-shrink: 0;
  width: 100%;
}

.chat-warp {
  // BubbleList 组件根元素（库内写死 height:100%、overflow visible），
  // 设为可伸缩项并允许压缩，Sender 展开时由它吸收高度变化
  :deep(.el-bubble-list-wrapper) {
    flex: 1 1 auto;
    min-height: 0;
  }

  // 内部滚动容器撑满 wrapper，配合库内 overflow:auto 实现消息区内滚动
  :deep(.el-bubble-list) {
    height: 100%;
  }
}

.chat-sender {
  width: 100%;
}

.sender-header {
  padding: 6px 12px 0;
}

// 附件轮播左右按钮
.prev-next-btn {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transform: translateY(-50%);

  &:hover {
    background-color: var(--el-fill-color);
  }
}

.prev-next-btn-left {
  left: 8px;
}

.prev-next-btn-right {
  right: 8px;
}

.sender-prefix {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  width: fit-content;
  overflow: hidden;
}

:deep() {
  .el-bubble-list {
    padding-top: 24px;
  }

  // 库内思考链 trigger 按钮写死白底浅边框，改用主题变量适配暗黑模式；
  // 文字（如"思考完成"）库内未设置颜色、走浏览器默认黑色，这里跟随主题文字色
  .el-thinking .trigger {
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border-color: var(--el-border-color-lighter);

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .el-bubble {
    padding: 0 12px 24px;
  }

  .el-typewriter {
    overflow: hidden;
    border-radius: 12px;
  }

  .user-content {
    // 换行
    white-space: pre-wrap;
  }

  // 用户消息图片列表
  .user-images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;

    .user-image {
      width: 120px;
      height: 120px;
      cursor: pointer;
      border-radius: 8px;
    }
  }

  // token 统计小字，跟随主题文字色
  .token-info {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .context-ring {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      transform: rotate(-90deg);

      circle {
        fill: none;
        stroke-width: 3;
      }

      .context-ring-track {
        stroke: var(--el-border-color-darker);
      }

      .context-ring-bar {
        stroke-linecap: round;
      }
    }
  }

  // 引用检索信息（可折叠卡片，置于正文上方）
  .retrieval-collapse {
    margin-bottom: 8px;
    font-size: 12px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    .el-collapse-item__header {
      height: 32px;
      padding: 0 10px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      background-color: transparent;
      border-bottom: none;
      border-radius: 8px;

      &:hover {
        background-color: var(--el-fill-color);
      }
    }

    .el-collapse-item__wrap {
      background-color: transparent;
      border-bottom: none;
    }

    .el-collapse-item__content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 4px 10px 10px;
    }
  }

  .retrieval-header {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-weight: 600;
  }

  .retrieval-link {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    max-width: 100%;
    min-width: 0;
    color: var(--el-text-color-regular);
    text-decoration: none;

    &:hover .retrieval-title {
      color: var(--el-color-primary);
    }
  }

  .retrieval-number {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    border-radius: 50%;
  }

  .retrieval-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 正文引用下标徽标（[n] 替换成的 cite 标签）
  .md-citation {
    display: inline-block;
    margin: 0 2px;
    padding: 0 5px;
    font-size: 11px;
    font-style: normal;
    line-height: 16px;
    color: var(--el-color-primary);
    cursor: pointer;
    user-select: none;
    vertical-align: 2px;
    background-color: var(--el-color-primary-light-9);
    border-radius: 4px;

    &:hover {
      background-color: var(--el-color-primary-light-7);
    }
  }

  .markdown-body {
    background-color: transparent;
  }

  .markdown-elxLanguage-header-div {
    top: -25px !important;
  }

  // 隐藏代码块头部的明暗主题切换按钮（保留复制按钮），主题跟随系统
  .markdown-elxLanguage-header-toggle {
    display: none;
  }

  // xmarkdown 样式
  // 库内默认 color:#000，这里改为跟随主题文字色，修复暗黑模式下字体为黑色的问题
  .elx-xmarkdown-container {
    padding: 8px 4px;
    color: var(--el-text-color-primary);

    // 库内表格单元格写死 #fff，改用主题变量保证暗黑模式下可读
    th {
      background-color: var(--el-bg-color);
    }

    tbody tr:nth-child(2n) {
      background-color: var(--el-bg-color);
    }
  }
}
// 引用下标 hover 卡片（Teleport 到 body，scoped 属性仍保留）
.citation-popover {
  position: fixed;
  z-index: 3000;
  max-width: 380px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  pointer-events: none;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  transform: translateX(-50%);

  // 显示在 cite 上方 / 下方
  &.is-top {
    transform: translateX(-50%) translateY(-100%);
  }

  .citation-popover-title {
    font-weight: 600;
  }

  .citation-popover-content {
    display: -webkit-box;
    margin-top: 6px;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }

  .citation-popover-url {
    margin-top: 6px;
    color: var(--el-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

<style lang="scss">
// 引用摘要 tooltip（popper 挂载在 body 下，scoped 样式无法命中，需全局定义）
.retrieval-tooltip {
  max-width: 360px;
  line-height: 1.6;
  word-break: break-word;
}
</style>
