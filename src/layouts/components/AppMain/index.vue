<script lang="ts" setup>
import IFrame from "@@/components/IFrame/index.vue"
import { useIframe } from "@/layouts/composables/useIframe"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useTagsViewStore } from "@/pinia/stores/tags-view"
import { Footer } from "../index"

const route = useRoute()

const tagsViewStore = useTagsViewStore()

const settingsStore = useSettingsStore()

const { isIframePage, iframeNotKeepAlive, keepAliveIframePages } = useIframe()
</script>

<template>
  <section class="app-main">
    <div class="app-scrollbar">
      <!-- 不缓存的 iframe：切走即销毁 -->
      <IFrame v-if="iframeNotKeepAlive" :key="route.path" :url="route.meta.iframeUrl!" class="app-container-grow" />
      <!-- 缓存的 iframe：v-for + v-show 保持 DOM 不销毁 -->
      <IFrame
        v-for="item in keepAliveIframePages"
        v-show="route.path === item.path"
        :key="item.path"
        :url="(item.meta?.iframeUrl as string)"
        class="app-container-grow"
      />
      <!-- 普通页面 -->
      <router-view v-slot="{ Component, route: viewRoute }" v-show="!isIframePage">
        <transition name="el-fade-in" mode="out-in">
          <keep-alive :include="tagsViewStore.cachedViews">
            <component :is="Component" :key="viewRoute.path" class="app-container-grow" />
          </keep-alive>
        </transition>
      </router-view>
      <!-- 页脚 -->
      <Footer v-if="settingsStore.showFooter" />
    </div>
    <!-- 返回顶部 -->
    <el-backtop />
    <!-- 返回顶部（固定 Header 情况下） -->
    <el-backtop target=".app-scrollbar" />
  </section>
</template>

<style lang="scss" scoped>
@import "@@/assets/styles/mixins.scss";

.app-main {
  width: 100%;
  display: flex;
}

.app-scrollbar {
  flex-grow: 1;
  overflow: auto;
  @extend %scrollbar;
  display: flex;
  flex-direction: column;
  .app-container-grow {
    flex-grow: 1;
  }
}
</style>
