<script lang="ts" setup>
import type * as Monaco from "monaco-editor"
import { useTheme } from "@@/composables/useTheme"
// 副作用导入：触发 monaco.ts 中的 worker 注册与 YAML 语言服务初始化
import { monaco } from "./monaco"

interface Props {
  /** 占位符 */
  placeholder?: string
  /** 是否禁用（只读） */
  disabled?: boolean
  /** 编辑器高度 */
  height?: string
  /** 强制语言；不传则按内容自动识别（{ 或 [ 开头为 JSON，否则 YAML） */
  language?: "json" | "yaml"
}

const {
  placeholder = "请输入内容",
  disabled = false,
  height = "200px",
  language
} = defineProps<Props>()

// 与父组件双向绑定的文本内容
const model = defineModel<string>()

// 是否处于全屏状态
const isFullscreen = ref(false)

const fullscreenIcon = computed(() => (isFullscreen.value ? "fullscreen-exit" : "fullscreen"))
const fullscreenTips = computed(() => (isFullscreen.value ? "退出全屏" : "全屏"))

// Monaco 挂载点与实例
const editorEl = ref<HTMLElement>()
let editor: Monaco.editor.IStandaloneCodeEditor | null = null
let resizeObserver: ResizeObserver | null = null

// 全屏时撑满视口，否则用 height prop
const editorStyle = computed(() => ({
  height: isFullscreen.value ? "calc(100vh - 16px)" : height
}))

/**
 * 按内容自动识别语言
 * 以 { 或 [ 开头判定为 JSON，其余视为 YAML
 */
function detectLanguage(value: string | undefined): "json" | "yaml" {
  const trimmed = (value ?? "").trimStart()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  return "yaml"
}

/**
 * 将项目主题名映射为 Monaco 内置主题
 * normal -> vs（浅色），dark / dark-blue -> vs-dark（深色）
 */
function resolveTheme(name: string | undefined): string {
  return name === "dark" || name === "dark-blue" ? "vs-dark" : "vs"
}

const { activeThemeName } = useTheme()

// 只读状态随 disabled prop 动态切换
watch(
  () => disabled,
  val => editor?.updateOptions({ readOnly: val })
)

// 行号跟随全屏状态：全屏时显示，恢复时隐藏
watch(isFullscreen, (val) => {
  editor?.updateOptions({ lineNumbers: val ? "on" : "off" })
})

// 主题切换时同步到 Monaco
watch(activeThemeName, (name) => {
  if (editor) monaco.editor.setTheme(resolveTheme(name))
})

/**
 * 外部赋值（弹窗打开 / 表单重置）时回填到编辑器
 * 用值比较避免编辑器自身输入触发的回环：若 newVal 与编辑器当前值一致则跳过
 */
watch(model, (newVal) => {
  if (!editor) return
  if (newVal === editor.getValue()) return
  editor.setValue(newVal ?? "")
  const lang = language ?? detectLanguage(newVal)
  const current = editor.getModel()?.getLanguageId()
  if (current !== lang) {
    monaco.editor.setModelLanguage(editor.getModel()!, lang)
  }
  editor.setPosition({ lineNumber: 1, column: 1 })
})

onMounted(() => {
  if (!editorEl.value) return
  const initial = model.value ?? ""
  editor = monaco.editor.create(editorEl.value, {
    value: initial,
    language: language ?? detectLanguage(initial),
    theme: resolveTheme(activeThemeName.value),
    placeholder,
    readOnly: disabled,
    automaticLayout: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    // 关闭滚动时上方置顶当前节点内容的「粘性滚动」
    stickyScroll: { enabled: false },
    wordWrap: "on",
    tabSize: 2,
    fontSize: 14,
    lineNumbers: "off",
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
  })

  // 编辑器内容变化：同步到 v-model，并在未指定语言时按内容重新识别
  editor.onDidChangeModelContent(() => {
    const val = editor!.getValue()
    model.value = val
    if (!language) {
      const lang = detectLanguage(val)
      const current = editor!.getModel()?.getLanguageId()
      if (current !== lang) {
        monaco.editor.setModelLanguage(editor!.getModel()!, lang)
      }
    }
  })

  // 容器尺寸变化（全屏切换 / 弹窗缩放）时重算编辑器布局
  resizeObserver = new ResizeObserver(() => editor?.layout())
  resizeObserver.observe(editorEl.value)
})

// 卸载时释放 worker、模型与编辑器实例，避免内存泄漏
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  editor?.getModel()?.dispose()
  editor?.dispose()
  editor = null
})

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

// 进入全屏时注册 ESC 监听，退出时自动移除
watchEffect(() => {
  if (isFullscreen.value) {
    document.addEventListener("keydown", handleKeydown, true)
    onWatcherCleanup(() => {
      document.removeEventListener("keydown", handleKeydown, true)
    })
  }
})

defineExpose({
  // 供父组件在表单重置时复位全屏状态
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
    <div ref="editorEl" class="editor-body" :style="editorStyle" />
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

.editor-body {
  width: 100%;
}

.editor-container.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  padding: 8px;
  background-color: var(--el-bg-color);
}
</style>
