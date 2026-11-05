<!--
  Popover 浮层组件（迁移自 ruoyi-element-ai components/Popover/index.vue）

  ⚠️ 原实现基于 @floating-ui/vue 的 useFloating（flip/shift/arrow/offset 中间件 +
  whileElementsMounted: autoUpdate 实时跟随）。
  为避免引入额外依赖，当前为手写简化实现：
    - position: fixed + trigger 的 getBoundingClientRect() 计算位置
    - 支持 top/top-start/top-end/bottom/bottom-start/bottom-end/left/right（含 start/end 变体）
    - 显示时定位一次，并在 window 滚动（capture）时重新定位
    - 简化处理：不支持 arrow 箭头、不做翻转（flip），超出视口时仅 clamp 到视口内
  如验收后需要更强的定位能力（嵌套滚动容器、翻转、箭头等），
  可引入 @floating-ui/vue 并将 updatePosition() 替换回 useFloating 实现，
  对外 API（show/hide、trigger 模式、插槽）保持不变。
-->
<script setup lang="ts">
import type { CSSProperties } from "vue"
import { nextTick, onBeforeUnmount, ref, watch } from "vue"

export type PopoverPlacement
  = | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end"
    | "right"
    | "right-start"
    | "right-end"

export type Offset = [number, number]

export interface PopoverProps {
  placement?: PopoverPlacement
  offset?: Offset
  popoverStyle?: CSSProperties
  popoverClass?: string
  trigger?: "hover" | "click" | "clickTarget"
  triggerStyle?: CSSProperties
  triggerClass?: string
  hoverDelay?: number // 悬停延迟关闭时间（ms）
}

const props = withDefaults(defineProps<PopoverProps>(), {
  placement: "bottom",
  offset: () => [0, 0],
  trigger: "hover",
  hoverDelay: 0
})

const emits = defineEmits<{
  (e: "show"): void
  (e: "hide"): void
}>()

const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const showPopover = ref(false)
const floatingStyles = ref<CSSProperties>({})
let hideTimeout: ReturnType<typeof setTimeout> | null = null
// 记录鼠标是否在触发元素或内容区域内
const isHovering = ref(false)

const VIEWPORT_MARGIN = 8

// 简化定位：根据 placement 与 trigger 矩形计算浮层位置
async function updatePosition() {
  const triggerEl = triggerRef.value
  const popoverEl = popoverRef.value
  if (!triggerEl || !popoverEl)
    return

  const rect = triggerEl.getBoundingClientRect()
  const size = { width: popoverEl.offsetWidth, height: popoverEl.offsetHeight }
  const [mainAxis, crossAxis] = props.offset

  let top = 0
  let left = 0

  switch (props.placement) {
    case "top":
    case "top-start":
    case "top-end":
      top = rect.top - size.height - mainAxis
      left = props.placement === "top"
        ? rect.left + rect.width / 2 - size.width / 2
        : props.placement === "top-start"
          ? rect.left + crossAxis
          : rect.right - size.width + crossAxis
      break
    case "bottom":
    case "bottom-start":
    case "bottom-end":
      top = rect.bottom + mainAxis
      left = props.placement === "bottom"
        ? rect.left + rect.width / 2 - size.width / 2
        : props.placement === "bottom-start"
          ? rect.left + crossAxis
          : rect.right - size.width + crossAxis
      break
    case "left":
    case "left-start":
    case "left-end":
      left = rect.left - size.width - mainAxis
      top = props.placement === "left"
        ? rect.top + rect.height / 2 - size.height / 2
        : props.placement === "left-start"
          ? rect.top + crossAxis
          : rect.bottom - size.height + crossAxis
      break
    case "right":
    case "right-start":
    case "right-end":
      left = rect.right + mainAxis
      top = props.placement === "right"
        ? rect.top + rect.height / 2 - size.height / 2
        : props.placement === "right-start"
          ? rect.top + crossAxis
          : rect.bottom - size.height + crossAxis
      break
  }

  // 超出视口时 clamp（简化版 flip）
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - size.width - VIEWPORT_MARGIN)
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - size.height - VIEWPORT_MARGIN)

  floatingStyles.value = { position: "fixed", top: `${top}px`, left: `${left}px` }
}

function show() {
  if (!showPopover.value) {
    showPopover.value = true
    emits("show")
    nextTick(updatePosition)
  }
  // 显示时强制清除定时器（无论是否在悬停）
  if (hideTimeout)
    clearTimeout(hideTimeout)
  hideTimeout = null
}

function hide() {
  if (showPopover.value) {
    showPopover.value = false
    emits("hide")
  }
  hideTimeout = null
}

defineExpose({ show, hide })

// 外点击关闭（click / clickTarget 模式）
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (popoverRef.value?.contains(target) || triggerRef.value?.contains(target))
    return
  hide()
}

// 打开期间滚动时重新定位
function handleScroll() {
  if (showPopover.value)
    updatePosition()
}

watch(showPopover, (newValue) => {
  if (newValue && props.trigger !== "hover") {
    // 等下一帧再注册，避免打开浮层的这次点击立即触发关闭
    nextTick(() => document.addEventListener("click", handleDocumentClick))
  } else {
    document.removeEventListener("click", handleDocumentClick)
  }
  if (newValue) {
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true })
  } else {
    window.removeEventListener("scroll", handleScroll, { capture: true })
  }
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick)
  window.removeEventListener("scroll", handleScroll, { capture: true })
  if (hideTimeout)
    clearTimeout(hideTimeout)
})

// 触发元素鼠标事件（hover 模式）
function handleTriggerMouseEnter() {
  if (props.trigger === "hover") {
    isHovering.value = true // 进入触发元素
    show()
  }
}

function handleTriggerMouseLeave() {
  if (props.trigger === "hover") {
    isHovering.value = false // 离开触发元素
    scheduleHideIfNeeded()
  }
}

function handlePopoverMouseEnter() {
  if (props.trigger === "hover") {
    isHovering.value = true // 进入内容区域
    if (hideTimeout)
      clearTimeout(hideTimeout) // 取消关闭
  }
}

function handlePopoverMouseLeave() {
  if (props.trigger === "hover") {
    isHovering.value = false // 离开内容区域
    scheduleHideIfNeeded()
  }
}

// 统一延迟关闭逻辑（仅当完全离开两个区域时触发）
function scheduleHideIfNeeded() {
  if (isHovering.value)
    return

  hideTimeout = setTimeout(() => {
    if (!isHovering.value) {
      hide()
    }
  }, props.hoverDelay)
}

function handleClick() {
  if (props.trigger === "click") {
    showPopover.value ? hide() : show()
  } else if (props.trigger === "clickTarget" && !showPopover.value) {
    show()
  }
}
</script>

<template>
  <div
    ref="triggerRef"
    class="popover-trigger"
    :class="[props.triggerClass]"
    :style="[props.triggerStyle]"
    @mouseenter="handleTriggerMouseEnter"
    @mouseleave="handleTriggerMouseLeave"
    @click="handleClick"
  >
    <slot name="trigger" />
  </div>

  <Teleport to="body">
    <Transition name="popover-fade">
      <div
        v-if="showPopover"
        ref="popoverRef"
        :style="[floatingStyles, props.popoverStyle]"
        class="popover-content-box"
        :class="[props.popoverClass]"
        @mouseenter="handlePopoverMouseEnter"
        @mouseleave="handlePopoverMouseLeave"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  will-change: transform, opacity;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.popover-fade-enter-to,
.popover-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
