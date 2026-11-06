<!-- 欢迎提示词（迁移自 ruoyi-element-ai components/WelecomeText/index.vue）
  注：模板中原使用 UnoCSS 原子类，已重写为 scoped SCSS。
-->
<script setup lang="ts">
import { computed } from "vue"
import { Typewriter } from "vue-element-plus-x"
import { useTimeGreeting } from "../../hooks/useTimeGreeting"
import { useUserStore } from "../../stores/user"

const greeting = useTimeGreeting()
const userStore = useUserStore()

const username = computed(() => userStore.userInfo?.username ?? "AI 助手")
</script>

<template>
  <div class="welcome-text">
    <Typewriter
      :content="`${greeting}好，${username}`"
      :typing="{
        step: 2,
        interval: 45,
      }"
      :is-fog="true"
    />
  </div>
</template>

<style scoped lang="scss">
.welcome-text {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  margin-bottom: 32px;
  font-size: 32px;
  font-weight: 600;
  line-height: 32px;
  text-align: center;

  :deep(.typer-container) {
    overflow: initial;
  }
}
</style>
