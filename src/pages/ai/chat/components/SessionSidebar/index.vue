<!-- 会话侧栏 -->
<script setup lang="ts">
import type { ConversationItem, ConversationMenuCommand } from "vue-element-plus-x/types/Conversations"
import type { ConversationVO } from "../../api/types"
import SvgCtrlK from "@@/assets/icons/ctrl-k.svg?component"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { Conversations } from "vue-element-plus-x"
import { useRoute, useRouter } from "vue-router"
import { deleteConversationApi, getConversationListApi, renameConversationApi } from "../../api"

// ============================== 会话列表（本组件私有数据） ==============================

const sessionList = ref<ConversationVO[]>([])

// 获取会话列表
async function fetchSessionList() {
  try {
    sessionList.value = await getConversationListApi()
  } catch (error) {
    console.error("fetchSessionList错误:", error)
  }
}

onMounted(fetchSessionList)

const route = useRoute()
const router = useRouter()

// 页内折叠状态：收起时面板整体隐藏，左上角保留展开入口图标
const isCollapse = ref(false)

const sessionId = computed(() => route.query?.sessionId)
// 选中态：Conversations 组件用 uniqueKey === active 严格相等判断高亮，
// uniqueKey 取自 rowKey 字段（后端 id 为 number），这里统一转成 number
const active = ref<number | undefined>()

watch(
  () => route.query?.sessionId,
  (id) => {
    active.value = id ? Number(id) : undefined
  },
  { immediate: true }
)

onMounted(() => {
  // 注册 Ctrl+K 快捷键（与"新对话"按钮等效）
  window.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown)
})

// Ctrl / Cmd + K 新建对话
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    handleCreatChat()
  }
}

// 创建会话（回到欢迎页，发送首条消息时才真正创建）
function handleCreatChat() {
  router.replace({ name: "AIChat" })
}

// 展开侧栏（点击收起状态下的入口图标）
function handleExpand() {
  isCollapse.value = false
}

// 切换会话
function handleChange(item: ConversationItem<ConversationVO>) {
  router.replace({
    name: "AIChat",
    query: { sessionId: `${item.id}` }
  })
}

// 右键菜单
function handleMenuCommand(command: ConversationMenuCommand, item: ConversationItem<ConversationVO>) {
  switch (command) {
    case "delete":
      ElMessageBox.confirm(`正在删除记录：${item.title}，确认删除？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          await deleteConversationApi(item.id!)
          fetchSessionList()
          // 如果删除的是当前会话，返回到默认页
          if (`${item.id}` === sessionId.value)
            router.replace({ name: "AIChat" })
        })
        .catch(() => {
          // 取消删除
        })
      break
    case "rename":
      ElMessageBox.prompt("", "编辑对话名称", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputErrorMessage: "请输入对话名称",
        confirmButtonClass: "el-button--primary",
        roundButton: false,
        inputValue: item.title, // 设置默认值
        autofocus: true,
        inputValidator: (value) => {
          if (!value) {
            return false
          }
          return true
        }
      }).then(({ value }) => {
        renameConversationApi(item.id!, value).then(() => {
          fetchSessionList()
          ElMessage({
            type: "success",
            message: "修改成功"
          })
        })
      })
      break
    default:
      break
  }
}

// 供父组件（AI Chat 页面）在创建会话后调用，刷新会话列表
defineExpose({ refresh: fetchSessionList })
</script>

<template>
  <!-- 收起状态：左上角保留展开入口图标，点击可重新展开面板 -->
  <div v-if="isCollapse" class="collapsed-entry">
    <el-icon class="expand-icon" title="展开对话历史" @click="handleExpand">
      <Fold />
    </el-icon>
  </div>
  <div
    class="aside-container"
    :class="{ 'aside-container-collapse': isCollapse }"
  >
    <div class="aside-wrapper">
      <div v-if="!isCollapse" class="aside-header">
        <span class="logo-text">AI 对话</span>
        <el-icon class="collapse-btn" title="收起" @click="isCollapse = true">
          <Fold />
        </el-icon>
      </div>

      <div class="aside-body">
        <div v-if="!isCollapse" class="creat-chat-btn-wrapper">
          <div class="creat-chat-btn" @click="handleCreatChat">
            <el-icon class="add-icon">
              <Plus />
            </el-icon>
            <span class="creat-chat-text">新对话</span>
            <SvgCtrlK class="ctrl-k-icon" />
          </div>
        </div>

        <div v-if="!isCollapse" class="aside-content">
          <div v-if="sessionList.length > 0" class="conversations-wrap">
            <Conversations
              v-model:active="active"
              :items="sessionList"
              :label-max-width="200"
              :show-tooltip="true"
              :tooltip-offset="60"
              show-built-in-menu
              row-key="id"
              label-key="title"
              tooltip-placement="right"
              :items-style="{
                marginLeft: '8px',
                userSelect: 'none',
                borderRadius: '10px',
                padding: '8px 12px',
              }"
              :items-active-style="{
                backgroundColor: 'var(--el-color-primary-light-9)',
                boxShadow: 'inset 1px 0 0 0 var(--el-color-primary)',
              }"
              :items-hover-style="{
                backgroundColor: 'var(--el-fill-color-light)',
              }"
              @menu-command="handleMenuCommand"
              @change="handleChange"
            />
          </div>

          <el-empty v-else class="aside-empty" description="暂无对话记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 收起状态：左上角展开入口图标
.collapsed-entry {
  position: absolute;
  top: 8px;
  left: 12px;
  z-index: 2;

  .expand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 5%);

    &:hover {
      color: var(--el-text-color-primary);
      background-color: var(--el-fill-color);
    }
  }
}

// 基础样式
// z-index 取 1：只需盖住聊天区内容（收起定位时），必须低于布局 fixed-header 的 z-index(9)，
// 否则 tags-view 的右键菜单（在 fixed-header 层叠上下文内，整体 z-index 9）会被侧栏遮挡
.aside-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  // 280px：保证 Conversations 内置的"重命名/删除"菜单按钮完整显示
  width: 280px;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-right: 0.5px solid var(--el-border-color-lighter);

  .aside-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;

    // 侧边栏头部样式
    .aside-header {
      display: flex;
      align-items: center;
      height: 36px;
      margin: 10px 12px 0;

      .logo-text {
        font-size: 16px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        transform: skewX(-2deg);
      }

      .collapse-btn {
        margin-left: auto;
        font-size: 16px;
        color: var(--el-text-color-secondary);
        cursor: pointer;

        &:hover {
          color: var(--el-text-color-primary);
        }
      }
    }

    // 侧边栏内容样式
    .aside-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;

      .creat-chat-btn-wrapper {
        padding: 0 12px;

        .creat-chat-btn {
          display: flex;
          gap: 6px;
          align-items: center;
          padding: 8px 6px;
          margin-top: 16px;
          margin-bottom: 6px;
          color: var(--el-color-primary);
          cursor: pointer;
          user-select: none;
          background-color: var(--el-color-primary-light-9);
          border: 1px solid var(--el-color-primary-light-7);
          border-radius: 12px;

          &:hover {
            background-color: var(--el-color-primary-light-8);
          }

          .creat-chat-text {
            font-size: 14px;
            font-weight: 700;
            line-height: 22px;
          }

          .add-icon {
            width: 24px;
            height: 24px;
            font-size: 16px;
          }

          .ctrl-k-icon {
            width: 37px;
            height: 24px;
            margin-left: auto;
            color: var(--el-color-primary-light-5);
          }
        }
      }

      .aside-content {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;

        // 会话列表高度-基础样式（页内自适应，替代原 calc(100vh - 110px)）
        .conversations-wrap {
          flex: 1;
          overflow: hidden;

          :deep(.label) {
            display: flex;
            align-items: center;
            height: 100%;
          }
        }

        .aside-empty {
          flex: 1;
        }
      }
    }
  }

  // 收起：整体移出视野，不占布局，仅保留左上角展开入口图标
  &.aside-container-collapse {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-right: none;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-105%);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }
}

// 样式穿透
:deep() {
  // 会话列表背景色
  .conversations-list {
    background-color: transparent !important;
  }

  // 库内 label 写死 #303133，改为主题文字色，修复暗黑模式下会话标题发灰
  .conversation-label {
    color: var(--el-text-color-primary) !important;
  }

  // 当前选中会话：标题用主题色加粗，强化与未选中项的区分
  .conversation-item.active .conversation-label {
    font-weight: 600;
    color: var(--el-color-primary) !important;
  }

  .conversation-timestamp {
    color: var(--el-text-color-secondary) !important;
  }

  // 群组标题样式 和 侧边栏菜单背景色一致
  .conversation-group-title {
    padding-left: 12px !important;
    background-color: var(--el-bg-color) !important;
  }

  // 库内"三个点"菜单图标 hover 写死 #d3d3d3，改用主题变量适配暗黑模式
  .conversation-content .conversation-dropdown-more-icon:hover {
    background-color: var(--el-fill-color-darker) !important;
  }

  // 库内菜单打开时写死会话项背景 #f0f0f0，改用主题变量（与 hover 样式一致）
  .conversation-item.menu-opened {
    background-color: var(--el-fill-color-light) !important;
  }
}
</style>
