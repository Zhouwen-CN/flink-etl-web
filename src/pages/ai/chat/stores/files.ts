// 对话聊天的文件上传列表（迁移自 ruoyi-element-ai stores/modules/files.ts）
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import { defineStore } from "pinia"
import { ref } from "vue"

export type ChatFileItem = FilesCardProps & {
  file: File
}

export const useFilesStore = defineStore("ai-chat-files", () => {
  const filesList = ref<ChatFileItem[]>([])

  // 设置文件列表
  const setFilesList = (list: ChatFileItem[]) => {
    filesList.value = list
  }

  // 把原生 File 转成附件卡片项，追加到列表（选择文件、粘贴截图都走这里）
  const addFiles = (files: File[]) => {
    if (!files.length)
      return
    const items = files.map(file =>
      ({
        uid: crypto.randomUUID(), // 不写 uid，文件列表展示不出来，elx 1.2.0 bug 待修复
        name: file.name,
        fileSize: file.size,
        file,
        maxWidth: "200px",
        showDelIcon: true, // 显示删除图标
        imgPreview: true, // 显示图片预览
        imgVariant: "square", // 图片预览的形状
        url: URL.createObjectURL(file) // 图片预览地址
      }) as ChatFileItem
    )
    filesList.value.push(...items)
  }

  // 根据索引删除 文件
  const deleteFileByIndex = (index: number) => {
    filesList.value.splice(index, 1)
  }

  return {
    filesList,
    setFilesList,
    addFiles,
    deleteFileByIndex
  }
})
