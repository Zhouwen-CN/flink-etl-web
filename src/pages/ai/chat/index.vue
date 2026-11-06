<!-- AI Chat 页面（迁移自 ruoyi-element-ai pages/chat/index.vue）
  结构说明：
  - 会话列表作为页内左侧面板（原项目在应用级 Aside 中），聊天区在右侧。
  - 用 query 而非路径参数携带 sessionId：tags-view 按 path 去重，路径不变可保证标签栏只有一个"AI 对话"标签。
  - 原 chatDefaul / chatWithId 两个布局已合并到本文件：Sender 输入区只有一份，
    按 route.query.sessionId 条件渲染 WelecomeText（无会话）或 BubbleList（有会话），
    提交时根据有无会话分流：无会话先创建会话再由 watch 触发发送，有会话直接 SSE 发送。
-->
<script setup lang="ts">
import type { BubbleProps } from "vue-element-plus-x/types/Bubble"
import type { BubbleListInstance } from "vue-element-plus-x/types/BubbleList"
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import type { ThinkingStatus } from "vue-element-plus-x/types/Thinking"
import type { SseChunk } from "./api/chat"
import { useTheme } from "@@/composables/useTheme"
import { computed, nextTick, ref, watch } from "vue"
import { Attachments, BubbleList, Sender, Thinking, XMarkdown } from "vue-element-plus-x"
import { useRoute } from "vue-router"
import { send } from "./api"
import FilesSelect from "./components/FilesSelect/index.vue"
import ModelSelect from "./components/ModelSelect/index.vue"
import SessionSidebar from "./components/SessionSidebar/index.vue"
import WelecomeText from "./components/WelecomeText/index.vue"
import { usePasteFiles } from "./hooks/usePasteFiles"
import { useChatStore } from "./stores/chat"
import { useFilesStore } from "./stores/files"
import { useModelStore } from "./stores/model"
import { useSessionStore } from "./stores/session"
import { useUserStore } from "./stores/user"

type MessageItem = BubbleProps & {
  key: number
  role: "ai" | "user" | "system"
  avatar: string
  thinkingStatus?: ThinkingStatus
  thinlCollapse?: boolean
  reasoning_content?: string
}

const route = useRoute()
const chatStore = useChatStore()
const modelStore = useModelStore()
const filesStore = useFilesStore()
const sessionStore = useSessionStore()
const userStore = useUserStore()

const sessionId = computed(() => route.query?.sessionId)

// 粘贴截图/图片自动加入附件
const { handlePaste } = usePasteFiles()

// 代码块主题跟随当前项目主题（黑暗/深蓝 → dark，默认 → light）
// XMarkdown 通过 default-theme-mode 切换 body.dark 并同步 shiki 高亮主题
const { activeThemeName } = useTheme()
const codeThemeMode = computed(() =>
  activeThemeName.value === "dark" || activeThemeName.value === "dark-blue" ? "dark" : "light"
)

// 用户头像
const avatar = computed(() => {
  const userInfo = userStore.userInfo
  return userInfo?.avatar || "https://avatars.githubusercontent.com/u/76239030?v=4"
})

const inputValue = ref("")
const senderRef = ref<InstanceType<typeof Sender> | null>(null)
const bubbleItems = ref<MessageItem[]>([])
const bubbleListRef = ref<BubbleListInstance | null>(null)

// 欢迎页输入框行数更大，会话页更小
const autoSize = computed(() =>
  sessionId.value
    ? { maxRows: 6, minRows: 2 }
    : { maxRows: 9, minRows: 3 }
)

// ⚠️ 原实现：const { stream, loading: isLoading, cancel } = useHookFetch({ request: send, onError: ... })
// 当前：mock send 返回 AsyncIterable，用手写 loading/abort 替代
const isLoading = ref(false)
let abortController: AbortController | null = null

// 记录进入思考中
let isThinking = false

watch(
  () => route.query?.sessionId,
  async (_id_) => {
    // 无会话 id：回到欢迎页，清空消息（等效原 chatWithId 卸载重建）
    if (!_id_) {
      bubbleItems.value = []
      return
    }

    // 判断当前会话id是否有聊天记录，有缓存则直接赋值展示
    if (chatStore.chatMap[`${_id_}`] && chatStore.chatMap[`${_id_}`].length) {
      bubbleItems.value = chatStore.chatMap[`${_id_}`] as MessageItem[]
      // 滚动到底部
      setTimeout(() => {
        bubbleListRef.value!.scrollToBottom()
      }, 350)
      return
    }

    // 无缓存则请求聊天记录
    await chatStore.requestChatList(`${_id_}`)
    // 请求聊天记录后，赋值回显，并滚动到底部
    bubbleItems.value = chatStore.chatMap[`${_id_}`] as MessageItem[]

    // 滚动到底部
    setTimeout(() => {
      bubbleListRef.value!.scrollToBottom()
    }, 350)

    // 如果本地有发送内容，则直接发送
    const v = localStorage.getItem("chatContent")
    if (v) {
      // 发送消息
      setTimeout(() => {
        startSSE(v)
      }, 350)

      localStorage.removeItem("chatContent")
    }
  },
  { immediate: true, deep: true }
)

// Sender 统一提交入口：无会话先创建会话（内容由 watch 读取 localStorage 后发送），有会话直接 SSE 发送
async function handleSend() {
  if (!route.query?.sessionId) {
    localStorage.setItem("chatContent", inputValue.value)
    await sessionStore.createSessionList({
      userId: userStore.userInfo?.userId as number,
      sessionContent: inputValue.value,
      sessionTitle: inputValue.value.slice(0, 10),
      remark: inputValue.value.slice(0, 10)
    })
    return
  }
  startSSE(inputValue.value)
}

// 封装数据处理逻辑
function handleDataChunk(chunk: Record<string, any>) {
  try {
    const reasoningChunk = chunk.choices?.[0].delta.reasoning_content
    if (reasoningChunk) {
      // 开始思考链状态
      bubbleItems.value[bubbleItems.value.length - 1].thinkingStatus = "thinking"
      bubbleItems.value[bubbleItems.value.length - 1].loading = true
      bubbleItems.value[bubbleItems.value.length - 1].thinlCollapse = true
      if (bubbleItems.value.length) {
        bubbleItems.value[bubbleItems.value.length - 1].reasoning_content += reasoningChunk
      }
    }

    // 另一种思考中形式，content中有 <think></think> 的格式
    // 一开始匹配到 <think> 开始，匹配到 </think> 结束，并处理标签中的内容为思考内容
    const parsedChunk = chunk.choices?.[0].delta.content
    if (parsedChunk) {
      const thinkStart = parsedChunk.includes("<think>")
      const thinkEnd = parsedChunk.includes("</think>")
      if (thinkStart) {
        isThinking = true
      }
      if (thinkEnd) {
        isThinking = false
      }
      if (isThinking) {
        // 开始思考链状态
        bubbleItems.value[bubbleItems.value.length - 1].thinkingStatus = "thinking"
        bubbleItems.value[bubbleItems.value.length - 1].loading = true
        bubbleItems.value[bubbleItems.value.length - 1].thinlCollapse = true
        if (bubbleItems.value.length) {
          bubbleItems.value[bubbleItems.value.length - 1].reasoning_content += parsedChunk
            .replace("<think>", "")
            .replace("</think>", "")
        }
      } else {
        // 结束 思考链状态
        bubbleItems.value[bubbleItems.value.length - 1].thinkingStatus = "end"
        bubbleItems.value[bubbleItems.value.length - 1].loading = false
        if (bubbleItems.value.length) {
          bubbleItems.value[bubbleItems.value.length - 1].content += parsedChunk
        }
      }
    }
  } catch (err) {
    // 这里如果使用了中断，会有报错，可以忽略不管
    console.error("解析数据时出错:", err)
  }
}

// 封装错误处理逻辑
function handleError(err: any) {
  console.error("Fetch error:", err)
}

async function startSSE(chatContent: string) {
  // 清空输入框
  inputValue.value = ""
  addMessage(chatContent, true)
  addMessage("", false)

  // 这里有必要调用一下 BubbleList 组件的滚动到底部 手动触发 自动滚动
  bubbleListRef.value?.scrollToBottom()

  isLoading.value = true
  abortController = new AbortController()
  isThinking = false

  try {
    for await (const chunk of send(
      {
        messages: bubbleItems.value
          .filter((item: any) => item.role === "user")
          .map((item: any) => ({
            role: item.role,
            content: item.content
          })),
        sessionId: route.query?.sessionId ? String(route.query.sessionId) : undefined,
        userId: userStore.userInfo?.userId,
        model: modelStore.currentModelInfo.modelName ?? ""
      },
      abortController.signal
    )) {
      handleDataChunk((chunk as SseChunk).result as Record<string, any>)
    }
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
    abortController = null
    // 停止打字器状态
    if (bubbleItems.value.length) {
      bubbleItems.value[bubbleItems.value.length - 1].typing = false
    }
  }
}

// 中断请求
function cancelSSE() {
  abortController?.abort()
  // 结束最后一条消息打字状态
  if (bubbleItems.value.length) {
    bubbleItems.value[bubbleItems.value.length - 1].typing = false
  }
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean) {
  const i = bubbleItems.value.length
  const obj: MessageItem = {
    key: i,
    avatar: isUser
      ? avatar.value
      : "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    avatarSize: "32px",
    role: isUser ? "user" : "system",
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
  filesStore.deleteFileByIndex(index)
}

watch(
  () => filesStore.filesList.length,
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
    <SessionSidebar />
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
              v-if="item.content && item.role === 'system'" :markdown="item.content" class="markdown-body"
              :themes="{ light: 'github-light', dark: 'github-dark' }" :default-theme-mode="codeThemeMode"
            />
            <!-- user 内容 纯文本 -->
            <div v-if="item.content && item.role === 'user'" class="user-content">
              {{ item.content }}
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
                  :items="filesStore.filesList"
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
                <FilesSelect />
                <ModelSelect />
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
