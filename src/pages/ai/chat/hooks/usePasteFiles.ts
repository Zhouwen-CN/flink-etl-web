// 粘贴图片/文件（如截图）自动加入附件列表

/**
 * 用法：在 Sender 上绑定原生粘贴事件
 * <Sender @paste="handlePaste">
 * @param addFiles 把文件追加进附件列表的回调（由调用方提供）
 */
export function usePasteFiles(addFiles: (files: File[]) => void) {
  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items)
      return

    const files: File[] = []
    let hasText = false

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file") {
        const file = item.getAsFile()
        if (file)
          files.push(file)
      } else if (item.kind === "string") {
        hasText = true
      }
    }

    if (!files.length)
      return

    // 纯图片/文件粘贴时阻止默认行为，避免内容被插入输入框
    if (!hasText)
      e.preventDefault()

    addFiles(files)
  }

  return { handlePaste }
}
