/**
 * 聊天模块用户信息适配器
 *
 * 原项目有独立的登录体系（token/userInfo + 登录弹框），迁移后直接
 * 复用当前项目的 admin 登录态，向上保持与原 useUserStore 相同的字段形状
 * （token / userInfo），组件层无需改动。
 */
import type { LoginUser } from "../api/types"
import { defineStore } from "pinia"
import { computed } from "vue"
import { useUserStore as useAdminUserStore } from "@/pinia/stores/user"

export const useUserStore = defineStore("ai-chat-user", () => {
  const adminUserStore = useAdminUserStore()

  // mock 模式下不依赖真实 token，兜底一个固定值
  const token = computed(() => adminUserStore.token || "mock-token")

  const userInfo = computed<LoginUser>(() => ({
    userId: adminUserStore.userId ?? 1,
    username: adminUserStore.nickname || adminUserStore.username || "用户",
    // admin 用户体系无头像字段，使用默认头像
    avatar: ""
  }))

  return { token, userInfo }
})
