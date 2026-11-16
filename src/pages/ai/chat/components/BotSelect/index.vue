<!-- 切换 Bot -->
<script setup lang="ts">
import type { BotOptionVO } from "../../api/types"
import SvgModels from "@@/assets/icons/models.svg?component"
import { computed, onMounted, ref } from "vue"
import { getBotListApi } from "../../api"
import Popover from "../Popover/index.vue"

// v-model：当前选中的 Bot（由父组件 AI Chat 页面持有，发送消息时读取）
const bot = defineModel<BotOptionVO | null>({ default: null })

// Bot 列表（本组件私有数据，首次获取后默认选中第一个）
const botList = ref<BotOptionVO[]>([])

async function requestBotList() {
  try {
    botList.value = await getBotListApi()
    if (!bot.value)
      bot.value = botList.value[0] ?? null
  } catch (error) {
    console.error("requestBotList错误:", error)
  }
}

onMounted(() => {
  requestBotList()
})

const currentBotName = computed(() => bot.value?.label ?? "")

/* 弹出面板 开始 */
const popoverStyle = ref({
  width: "200px",
  padding: "4px",
  height: "fit-content",
  background: "var(--el-bg-color, #fff)",
  border: "1px solid var(--el-border-color-light)",
  borderRadius: "8px",
  boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.1)"
})
const popoverRef = ref()

// 显示
async function showPopover() {
  // 获取最新的 Bot 列表
  await requestBotList()
}

// 点击
function handleClick(item: BotOptionVO) {
  bot.value = item
  popoverRef.value?.hide?.()
}

defineExpose({ botList })
</script>

<template>
  <div class="bot-select">
    <Popover
      ref="popoverRef"
      placement="top-start"
      :offset="[4, 0]"
      popover-class="popover-content"
      :popover-style="popoverStyle"
      trigger="clickTarget"
      @show="showPopover"
    >
      <!-- 触发元素插槽 -->
      <template #trigger>
        <div class="bot-select-box">
          <div class="bot-select-box-icon">
            <SvgModels class="models-icon" />
          </div>
          <div class="bot-select-box-text">
            {{ currentBotName }}
          </div>
        </div>
      </template>

      <div class="popover-content-box">
        <div
          v-for="item in botList"
          :key="item.value"
          class="popover-content-box-items"
        >
          <div
            class="popover-content-box-item"
            :class="{ 'is-select': item.value === bot?.value }"
            @click="handleClick(item)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.bot-select-box {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 10px;
  font-size: 12px;
  user-select: none;
  cursor: pointer;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, rgb(235.9 245.3 255));
  border: 1px solid var(--el-color-primary, #409eff);
  border-radius: 10px;

  .models-icon {
    width: 12px;
    height: 12px;
  }

  .bot-select-box-text {
    font-size: 12px;
  }
}

.popover-content-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 200px;
  overflow: hidden auto;

  .popover-content-box-items {
    width: 100%;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  .popover-content-box-item {
    padding: 4px;
    font-size: 12px;
    line-height: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &.is-select {
      font-weight: 700;
      color: var(--el-color-primary, #409eff);
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  &::-webkit-scrollbar-thumb {
    background: #cccccc;
    border-radius: 4px;
  }
}
</style>
