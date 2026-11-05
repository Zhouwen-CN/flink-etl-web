// 会话管理 store（迁移自 ruoyi-element-ai stores/modules/session.ts）
import type { ChatSessionVo, CreateSessionDTO, GetSessionListParams } from "../api/types"
import { ChatLineRound } from "@element-plus/icons-vue"
import { defineStore } from "pinia"
import { markRaw, ref } from "vue"
import { useRouter } from "vue-router"
import { create_session, delete_session, get_session, get_session_list, update_session } from "../api"
import { useUserStore } from "./user"

export const useSessionStore = defineStore("ai-chat-session", () => {
  const router = useRouter()
  const userStore = useUserStore()

  // 当前选中的会话信息
  const currentSession = ref<ChatSessionVo | null>(null)
  // 设置当前会话
  const setCurrentSession = (session: ChatSessionVo | null) => {
    currentSession.value = session
  }

  // 会话列表核心状态
  const sessionList = ref<ChatSessionVo[]>([]) // 会话数据列表
  const currentPage = ref(1) // 当前页码（从1开始）
  const pageSize = ref(25) // 每页显示数量
  const hasMore = ref(true) // 是否还有更多数据
  const isLoading = ref(false) // 全局加载状态（初始加载/刷新）
  const isLoadingMore = ref(false) // 加载更多状态（区分初始加载）

  // 创建新对话（按钮点击）
  const createSessionBtn = async () => {
    try {
      // 清空当前选中会话信息
      setCurrentSession(null)
      router.replace({ name: "AIChat" })
    } catch (error) {
      console.error("createSessionBtn错误:", error)
    }
  }

  // 获取会话列表（核心分页方法）
  const requestSessionList = async (page: number = currentPage.value, force: boolean = false) => {
    if (!force && ((page > 1 && !hasMore.value) || isLoading.value || isLoadingMore.value))
      return

    isLoading.value = page === 1 // 第一页时标记为全局加载
    isLoadingMore.value = page > 1 // 非第一页时标记为加载更多

    try {
      const params: GetSessionListParams = {
        userId: userStore.userInfo?.userId as number,
        pageNum: page,
        pageSize: pageSize.value,
        isAsc: "desc",
        orderByColumn: "createTime"
      }

      const resArr = await get_session_list(params)

      // 预处理会话分组 并添加前缀图标
      const res = processSessions(resArr.rows)

      // 重建列表：第一页以服务端返回为准（本地多余/已删除的会话不保留），
      // 非第一页是更旧的数据，去重后追加到列表末尾
      if (page === 1) {
        sessionList.value = [...res]
      } else {
        sessionList.value = [
          ...sessionList.value.filter(item => !res.some(r => r.id === item.id)), // 保留现有数据（除了被当前页更新的）
          ...res // 追加当前页的新数据（更旧的）
        ]
      }

      // 判断是否还有更多数据（当前页数据量 < pageSize 则无更多），并更新页码
      hasMore.value = (res?.length || 0) === pageSize.value
      currentPage.value = page
    } catch (error) {
      console.error("requestSessionList错误:", error)
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  // 发送消息后创建新会话
  const createSessionList = async (data: Omit<CreateSessionDTO, "id">) => {
    try {
      const res = await create_session(data)
      // 创建会话后立刻刷新列表
      await requestSessionList(1, true)
      // 并将当前勾选信息设置为新增的会话信息
      const newSessionRes = await get_session(`${res.data}`)
      setCurrentSession(newSessionRes.data)

      // 跳转聊天页（query 携带会话id，保持 path 不变，tags-view 只保留一个标签）
      router.replace({
        name: "AIChat",
        query: { sessionId: `${res.data}` }
      })
    } catch (error) {
      console.error("createSessionList错误:", error)
    }
  }

  // 加载更多会话（供组件调用）
  const loadMoreSessions = async () => {
    if (hasMore.value)
      await requestSessionList(currentPage.value + 1)
  }

  // 更新会话（供组件调用）
  const updateSession = async (item: ChatSessionVo) => {
    try {
      await update_session(item)
      // 刷新会话列表
      await requestSessionList(1, true)
    } catch (error) {
      console.error("updateSession错误:", error)
    }
  }

  // 删除会话（供组件调用）
  const deleteSessions = async (ids: string[]) => {
    try {
      await delete_session(ids)
      // 刷新会话列表
      await requestSessionList(1, true)
    } catch (error) {
      console.error("deleteSessions错误:", error)
    }
  }

  // 在获取会话列表后添加预处理逻辑
  function processSessions(sessions: ChatSessionVo[]) {
    const currentDate = new Date()

    return sessions.map((session) => {
      const createDate = new Date(session.createTime!)
      const diffDays = Math.floor(
        (currentDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // 生成原始分组键（用于排序和分组）
      let group: string
      if (diffDays < 7) {
        group = "7 天内" // 用数字前缀确保排序正确
      } else if (diffDays < 30) {
        group = "30 天内"
      } else {
        const year = createDate.getFullYear()
        const month = String(createDate.getMonth() + 1).padStart(2, "0")
        group = `${year}-${month}` // 格式：2025-05
      }

      return {
        ...session,
        group, // 新增分组键字段
        prefixIcon: markRaw(ChatLineRound) // 图标为静态组件，使用 markRaw 标记为静态组件
      }
    })
  }

  return {
    // 当前选中的会话
    currentSession,
    // 设置当前会话
    setCurrentSession,
    // 列表状态
    sessionList,
    currentPage,
    pageSize,
    hasMore,
    isLoading,
    isLoadingMore,
    // 列表方法
    createSessionBtn,
    createSessionList,
    requestSessionList,
    loadMoreSessions,
    updateSession,
    deleteSessions
  }
})
