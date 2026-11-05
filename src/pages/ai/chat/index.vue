<!-- AI Chat 页面壳（迁移自 ruoyi-element-ai pages/chat/index.vue）
  结构调整：原项目会话列表在应用级 Aside 中；迁移后作为页内左侧面板与本聊天区并列，
  右侧按 route.query.sessionId 切换默认页/会话页。
  用 query 而非路径参数：tags-view 按 path 去重，路径不变可保证标签栏只有一个"AI 对话"标签。
-->
<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import SessionSidebar from "./components/SessionSidebar/index.vue"
import ChatDefaul from "./layouts/chatDefaul/index.vue"
import ChatWithId from "./layouts/chatWithId/index.vue"

const route = useRoute()
const sessionId = computed(() => route.query?.sessionId)
</script>

<template>
  <div class="ai-chat-page">
    <SessionSidebar />
    <div class="chat-container">
      <!-- 默认聊天页面 -->
      <ChatDefaul v-if="!sessionId" />
      <!-- 带id的聊天页面 -->
      <ChatWithId v-else />
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
</style>
