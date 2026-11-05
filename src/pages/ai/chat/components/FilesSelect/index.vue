<!-- 文件上传（迁移自 ruoyi-element-ai components/FilesSelect/index.vue）
  点击纸夹图标直接调起系统文件选择框；粘贴截图转附件见 hooks/usePasteFiles.ts
-->
<script setup lang="ts">
import { ref } from "vue"
import { useFilesStore } from "../../stores/files"

const filesStore = useFilesStore()

const fileInputRef = ref<HTMLInputElement | null>(null)

function open() {
  const input = fileInputRef.value
  if (!input)
    return
  // 先清空，保证连续选择同一文件也能触发 change
  input.value = ""
  input.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files)
    filesStore.addFiles(Array.from(input.files))
  input.value = ""
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
    <div class="trigger-btn" @click="open">
      <el-icon>
        <Paperclip />
      </el-icon>
    </div>
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
</style>
