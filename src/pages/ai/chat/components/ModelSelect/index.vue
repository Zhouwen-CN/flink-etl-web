<!-- 切换模型（迁移自 ruoyi-element-ai components/ModelSelect/index.vue）
  注：模板中原使用 UnoCSS 原子类，已重写为 scoped SCSS；
  原 SvgIcon(name="models") 改为 vite-svg-loader 的 ?component 导入。
-->
<script setup lang="ts">
import type { GetSessionListVO } from "../../api/types"
import SvgModels from "@@/assets/icons/models.svg?component"
import { computed, onMounted, ref } from "vue"
import { useModelStore } from "../../stores/model"
import Popover from "../Popover/index.vue"

const modelStore = useModelStore()

onMounted(async () => {
  await modelStore.requestModelList()
  // 设置默认模型
  if (
    modelStore.modelList.length > 0
    && (!modelStore.currentModelInfo || !modelStore.currentModelInfo.modelName)
  ) {
    modelStore.setCurrentModelInfo(modelStore.modelList[0])
  }
})

const currentModelName = computed(
  () => modelStore.currentModelInfo && modelStore.currentModelInfo.modelName
)
const popoverList = computed(() => modelStore.modelList)

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
  // 获取最新的模型列表
  await modelStore.requestModelList()
}

// 点击
function handleClick(item: GetSessionListVO) {
  modelStore.setCurrentModelInfo(item)
  popoverRef.value?.hide?.()
}
</script>

<template>
  <div class="model-select">
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
        <div class="model-select-box">
          <div class="model-select-box-icon">
            <SvgModels class="models-icon" />
          </div>
          <div class="model-select-box-text">
            {{ currentModelName }}
          </div>
        </div>
      </template>

      <div class="popover-content-box">
        <div
          v-for="item in popoverList"
          :key="item.id"
          class="popover-content-box-items"
        >
          <Popover
            trigger-class="popover-trigger-item-text"
            popover-class="rounded-tooltip"
            placement="right"
            trigger="hover"
            :offset="[12, 0]"
          >
            <template #trigger>
              <div
                class="popover-content-box-item"
                :class="{ 'is-select': item.modelName === currentModelName }"
                @click="handleClick(item)"
              >
                {{ item.modelName }}
              </div>
            </template>
            <div class="popover-content-box-item-text">
              {{ item.remark }}
            </div>
          </Popover>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.model-select-box {
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

  .model-select-box-text {
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

    :deep() {
      .popover-trigger-item-text {
        width: 100%;
      }
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

  .popover-content-box-item-text {
    max-width: 200px;
    padding: 8px;
    font-size: 12px;
    line-height: 1.25;
    color: white;
    word-wrap: break-word;
    background-color: black;
    border-radius: 8px;
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
