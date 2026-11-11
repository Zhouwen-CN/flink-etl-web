<!-- AI Chat 页面 -->
<script setup lang="ts">
import type { BubbleProps } from "vue-element-plus-x/types/Bubble"
import type { BubbleListInstance } from "vue-element-plus-x/types/BubbleList"
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import type { ThinkingStatus } from "vue-element-plus-x/types/Thinking"
import type { ChatMessage, DoneAttributes, ModelOptionVO } from "./api/types"
import { useTheme } from "@@/composables/useTheme"
import { computed, nextTick, ref, watch } from "vue"
import { Attachments, BubbleList, Sender, Thinking, XMarkdown } from "vue-element-plus-x"
import { useRoute, useRouter } from "vue-router"
import { createConversationApi, getConversationMessageListApi, streamChat } from "./api"
import FilesSelect from "./components/FilesSelect/index.vue"
import ModelSelect from "./components/ModelSelect/index.vue"
import SessionSidebar from "./components/SessionSidebar/index.vue"
import WelecomeText from "./components/WelecomeText/index.vue"
import { usePasteFiles } from "./hooks/usePasteFiles"

type MessageItem = BubbleProps & {
  key: number
  role: "ai" | "user"
  avatar: string
  thinkingStatus?: ThinkingStatus
  thinlCollapse?: boolean
  reasoning_content?: string
  inputToken?: number
  outputToken?: number
  totalToken?: number
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
function addFiles(files: File[]) {
  if (!files.length)
    return
  const items = files.map(file =>
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

// 当前选中的模型
const currentModel = ref<ModelOptionVO | null>(null)

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

watch(
  () => route.query?.sessionId,
  async (id) => {
    // 无会话 id：回到欢迎页，清空消息
    if (!id) {
      bubbleItems.value = []
      return
    }

    // 加载会话历史消息并回显
    try {
      const messages = await getConversationMessageListApi(Number(id))
      bubbleItems.value = messages.map(mapHistoryMessage)
    } catch (error) {
      console.error("getConversationMessageList错误:", error)
      bubbleItems.value = []
    }

    // 滚动到底部
    setTimeout(() => {
      bubbleListRef.value?.scrollToBottom()
    }, 350)

    // 新创建的会话：发送暂存的第一条消息
    if (pendingMessage.value) {
      const message = pendingMessage.value
      pendingMessage.value = ""
      startSSE(message)
    }
  },
  { immediate: true }
)

// Sender 统一提交入口：无会话先创建会话（内容由 watch 中 pendingMessage 触发发送），有会话直接 SSE 发送
async function handleSend() {
  const content = inputValue.value
  if (!content.trim())
    return

  if (!route.query?.sessionId) {
    // 开启新聊天：先创建会话（后端要调大模型生成标题，耗时较长，Sender 置为 loading），
    // 拿到会话 id 才能调用 chat 接口
    if (!currentModel.value) {
      ElMessage.warning("请先选择模型")
      return
    }
    pendingMessage.value = content
    inputValue.value = ""
    isLoading.value = true
    try {
      const vo = await createConversationApi({ modelId: currentModel.value.value, message: content })
      // 刷新侧栏会话列表
      sidebarRef.value?.refresh()
      // 跳转聊天页（query 携带会话id，保持 path 不变，tags-view 只保留一个标签），
      // loading 由 watch 中触发的 startSSE 接管
      router.replace({ name: "AIChat", query: { sessionId: `${vo.id}` } })
    } catch (error) {
      console.error("createSession错误:", error)
      isLoading.value = false
      pendingMessage.value = ""
      inputValue.value = content
    }
    return
  }
  startSSE(content)
}

// SSE 流式回调：思考链 / 正文 / 结束 / 错误
function handleThinkingChunk(text: string) {
  const last = bubbleItems.value[bubbleItems.value.length - 1]
  if (!last)
    return
  last.thinkingStatus = "thinking"
  last.loading = true
  last.thinlCollapse = true
  last.reasoning_content = (last.reasoning_content ?? "") + text
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

async function startSSE(chatContent: string) {
  if (!currentModel.value) {
    ElMessage.warning("请先选择模型")
    return
  }

  // 清空输入框
  inputValue.value = ""
  addMessage(chatContent, true)
  addMessage("", false)

  // 这里有必要调用一下 BubbleList 组件的滚动到底部 手动触发 自动滚动
  bubbleListRef.value?.scrollToBottom()

  isLoading.value = true
  abortController = new AbortController()

  try {
    await streamChat(
      {
        modelId: currentModel.value.value,
        conversationId: Number(sessionId.value),
        message: chatContent
      },
      {
        onThinking: handleThinkingChunk,
        onText: handleTextChunk,
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
      ElMessage.error("聊天服务异常")
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

/** 把后端历史消息（USER/AI JSON）映射为气泡数据 */
function mapHistoryMessage(message: ChatMessage, index: number): MessageItem {
  if (message.type === "USER") {
    return {
      key: index,
      avatar: USER_AVATAR,
      avatarSize: "32px",
      role: "user",
      placement: "end",
      content: (message.contents ?? []).map(item => item.text).join(""),
      noStyle: false
    }
  }
  return {
    key: index,
    avatar: AI_AVATAR,
    avatarSize: "32px",
    role: "ai",
    placement: "start",
    isMarkdown: true,
    content: message.text ?? "",
    reasoning_content: message.thinking ?? "",
    thinkingStatus: "end",
    thinlCollapse: false,
    noStyle: true
  }
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean) {
  const obj: MessageItem = {
    key: bubbleItems.value.length,
    avatar: isUser ? USER_AVATAR : AI_AVATAR,
    avatarSize: "32px",
    role: isUser ? "user" : "ai",
    placement: isUser ? "end" : "start",
    isMarkdown: !isUser,
    loading: !isUser,
    content: message || "",
    reasoning_content: "",
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
              v-if="item.reasoning_content" v-model="item.thinlCollapse" :content="item.reasoning_content"
              :status="item.thinkingStatus" class="thinking-chain-warp"
              color="var(--el-text-color-regular)" background-color="var(--el-fill-color-light)" @change="handleChange"
            />
          </template>

          <template #content="{ item }">
            <!-- chat 内容走 markdown -->
            <XMarkdown
              v-if="item.content && item.role === 'ai'" :markdown="item.content" class="markdown-body"
              :themes="{ light: 'github-light', dark: 'github-dark' }" :default-theme-mode="codeThemeMode"
            />
            <!-- user 内容 纯文本 -->
            <div v-if="item.content && item.role === 'user'" class="user-content">
              {{ item.content }}
            </div>
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
                <ModelSelect v-model="currentModel" />
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
