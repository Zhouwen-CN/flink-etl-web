<script lang="ts" setup>
interface Props {
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** textarea 行数 */
  rows?: number
}

const {
  placeholder = "请输入内容",
  disabled = false,
  rows = 6
} = defineProps<Props>()

const inputValue = defineModel<string>()

const isFullscreen = ref(false)

const fullscreenIcon = computed(() => (isFullscreen.value ? "fullscreen-exit" : "fullscreen"))
const fullscreenTips = computed(() => (isFullscreen.value ? "退出全屏" : "全屏"))

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// 全屏时拦截 ESC，先退出全屏而非关闭外层弹窗
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isFullscreen.value) {
    e.stopPropagation()
    isFullscreen.value = false
  }
}

watchEffect(() => {
  if (isFullscreen.value) {
    document.addEventListener("keydown", handleKeydown, true)
    onWatcherCleanup(() => {
      document.removeEventListener("keydown", handleKeydown, true)
    })
  }
})

defineExpose({
  resetFullscreen: () => {
    isFullscreen.value = false
  }
})
</script>

<template>
  <div class="editor-container" :class="{ 'is-fullscreen': isFullscreen }">
    <el-tooltip effect="dark" :content="fullscreenTips" placement="bottom">
      <SvgIcon :name="fullscreenIcon" class="fullscreen-icon" @click="toggleFullscreen" />
    </el-tooltip>
    <el-input
      v-model="inputValue"
      type="textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="editor-input"
    />
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  position: relative;
  width: 100%;
}

.fullscreen-icon {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 10;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  &:hover {
    color: var(--el-color-primary);
  }
  &:focus {
    outline: none;
  }
}

.editor-container.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  padding: 8px;
  background-color: var(--el-bg-color);
  .editor-input {
    :deep(.el-textarea__inner) {
      height: calc(100vh - 16px) !important;
      resize: none;
    }
  }
}
</style>
