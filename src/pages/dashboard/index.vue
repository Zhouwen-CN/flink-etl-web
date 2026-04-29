<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"
import SvgDashboard from "./images/dashboard.svg?component" // vite-svg-loader 插件的功能

const userStore = useUserStore()
</script>

<template>
  <div class="app-container center">
    <SvgDashboard class="svg" />
    <p>欢迎回来，「{{ userStore.username }}」</p>
  </div>
</template>

<style lang="scss" scoped>
.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .svg {
    width: 600px;
    max-width: 100%;
  }
}
</style>
