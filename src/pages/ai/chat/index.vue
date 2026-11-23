<!-- AI Chat 页面 -->
<script setup lang="ts">
import type { BubbleProps } from "vue-element-plus-x/types/Bubble"
import type { BubbleListInstance } from "vue-element-plus-x/types/BubbleList"
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import type { ThinkingStatus } from "vue-element-plus-x/types/Thinking"
import type { AiMessageVO, BotOptionVO, ChatMessage, DoneAttributes, ToolExecutionRequest, ToolExecutionResult, UserImageContent } from "./api/types"
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
  inputToken?: number
  outputToken?: number
  totalToken?: number
  /** 用户消息携带的图片（data URL） */
  images?: string[]
}

const USER_AVATAR = "https://avatars.githubusercontent.com/u/76239030?v=4"
const AI_AVATAR = "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => route.query?.sessionId)

// ============================== 附件（原 files store 下沉到本组件） ==============================

type ChatFileItem = FilesCardProps & {
  file: File
}

const filesList = ref<ChatFileItem[]>([])

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
      uid: crypto.randomUUID(), // 不写 uid，文件列表展示不出来，elx 1.2.0 bug 待修复
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
    last.inputToken = attributes.inputToken
    last.outputToken = attributes.outputToken
    last.totalToken = attributes.totalToken
  }
  last.thinkingStatus = "end"
  last.loading = false
  last.typing = false
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
        avatar: USER_AVATAR,
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
            avatar: AI_AVATAR,
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
    }
  }
  return items
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean, images: string[] = []) {
  const obj: MessageItem = {
    key: bubbleItems.value.length,
    avatar: isUser ? USER_AVATAR : AI_AVATAR,
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
            <!-- chat 内容走 markdown -->
            <XMarkdown
              v-if="item.content && item.role === 'ai'" :markdown="item.content" class="markdown-body"
              :themes="{ light: 'github-light', dark: 'github-dark' }" :default-theme-mode="codeThemeMode"
            />
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
            <div v-if="item.role === 'ai' && item.totalToken" class="token-info">
              输入 {{ item.inputToken ?? 0 }} · 输出 {{ item.outputToken ?? 0 }} · 总计 {{ item.totalToken }}
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
    font-size: 12px;
    color: var(--el-text-color-secondary);
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
</style>
