// 对话聊天的文件上传列表（迁移自 ruoyi-element-ai stores/modules/files.ts）
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import { defineStore } from "pinia"
import { ref } from "vue"

export const useFilesStore = defineStore("ai-chat-files", () => {
  const filesList = ref<FilesCardProps & { file: File }[]>([])

  // 设置文件列表
  const setFilesList = (list: FilesCardProps & { file: File }[]) => {
    filesList.value = list
  }

  // 根据索引删除 文件
  const deleteFileByIndex = (index: number) => {
    filesList.value.splice(index, 1)
  }

  return {
    filesList,
    setFilesList,
    deleteFileByIndex
  }
})
