<!-- 文件上传（迁移自 ruoyi-element-ai components/FilesSelect/index.vue）
  ⚠️ 原实现使用 @vueuse/core 的 useFileDialog({ accept, directory, multiple }) 提供的
     open() / reset() / onChange() 能力。
  为避免引入额外依赖，当前改用原生 <input type="file"> 实现（见下方 fileInputRef 相关逻辑）。
  如验收后希望引入 @vueuse/core，可将 handleUploadFiles/onChange 替换回：
    const { reset, open, onChange } = useFileDialog({ accept: "...", directory: false, multiple: true })
  其余逻辑不变。
  注：模板中原使用 UnoCSS 原子类，已重写为 scoped SCSS。
-->
<script setup lang="ts">
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import SvgCode from "@@/assets/icons/code.svg?component"
import { ref } from "vue"
import { useFilesStore } from "../../stores/files"
import Popover from "../Popover/index.vue"

type FilesList = FilesCardProps & {
  file: File
}

const filesStore = useFilesStore()

/* 弹出面板 开始 */
const popoverStyle = ref({
  padding: "4px",
  height: "fit-content",
  background: "var(--el-bg-color, #fff)",
  border: "1px solid var(--el-border-color-light)",
  borderRadius: "8px",
  boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.1)"
})
const popoverRef = ref()
/* 弹出面板 结束 */

// ⚠️ 原实现：@vueuse/core useFileDialog（见文件头注释），当前为原生 input[type=file] 替代
const fileInputRef = ref<HTMLInputElement | null>(null)

function open() {
  fileInputRef.value?.click()
}

function reset() {
  if (fileInputRef.value)
    fileInputRef.value.value = ""
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0)
    return
  const arr = [] as FilesList[]
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    arr.push({
      uid: crypto.randomUUID(), // 不写 uid，文件列表展示不出来，elx 1.2.0 bug 待修复
      name: file.name,
      fileSize: file.size,
      file,
      maxWidth: "200px",
      showDelIcon: true, // 显示删除图标
      imgPreview: true, // 显示图片预览
      imgVariant: "square", // 图片预览的形状
      url: URL.createObjectURL(file) // 图片预览地址
    })
  }
  filesStore.setFilesList([...filesStore.filesList, ...arr])
  // 重置文件选择器
  reset()
}

function handleUploadFiles() {
  open()
  popoverRef.value.hide()
}

function handleNotOpen() {
  ElMessage.warning("暂未开放")
}
</script>

<template>
  <div class="files-select">
    <input
      ref="fileInputRef"
      type="file"
      class="hidden-input"
      multiple
      accept="image/*,video/*,audio/*,application/*"
      @change="onFileChange"
    >
    <Popover
      ref="popoverRef"
      placement="top-start"
      :offset="[4, 0]"
      popover-class="popover-content"
      :popover-style="popoverStyle"
      trigger="clickTarget"
    >
      <template #trigger>
        <div class="trigger-btn">
          <el-icon>
            <Paperclip />
          </el-icon>
        </div>
      </template>

      <div class="popover-content-box">
        <div class="popover-content-item" @click="handleUploadFiles">
          <el-icon>
            <Upload />
          </el-icon>
          <div class="popover-content-item-text">
            上传文件或图片
          </div>
        </div>

        <Popover
          placement="right-end"
          :offset="[8, 4]"
          popover-class="popover-content"
          :popover-style="popoverStyle"
          trigger="hover"
          :hover-delay="100"
        >
          <template #trigger>
            <div class="popover-content-item">
              <SvgCode class="code-icon" />
              <div class="popover-content-item-text">
                上传代码
              </div>
              <el-icon class="ml-auto">
                <ArrowRight />
              </el-icon>
            </div>
          </template>

          <div class="popover-content-box">
            <div class="popover-content-item" @click="handleNotOpen">
              代码文件
            </div>

            <div class="popover-content-item" @click="handleNotOpen">
              代码文件夹
            </div>
          </div>
        </Popover>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.hidden-input {
  display: none;
}

// 触发按钮（原子类: flex items-center gap-4px p-10px rounded-10px cursor-pointer font-size-14px border hover:bg）
.trigger-btn {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.popover-content-box {
  display: flex;
  flex-direction: column;

  .popover-content-item {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 10px;
    font-size: 14px;
    cursor: pointer;
    border-radius: 10px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .popover-content-item-text {
      font-size: 14px;
    }

    .code-icon {
      width: 16px;
      height: 16px;
    }

    .ml-auto {
      margin-left: auto;
    }
  }
}
</style>
