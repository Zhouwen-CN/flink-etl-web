import type { App } from "vue"
import ElementPlusX from "vue-element-plus-x"
import { installElementPlusIcons } from "./element-plus-icons"
import { installPermissionDirective } from "./permission-directive"
import { installSvgIcon } from "./svg-icon"

// 注册 AI 聊天组件库（Sender/BubbleList/Thinking/XMarkdown/Attachments/Conversations 等，
// 供 src/pages/ai/chat 页面使用，install 时自带组件样式）
function installElementPlusX(app: App) {
  app.use(ElementPlusX)
}

export function installPlugins(app: App) {
  installElementPlusIcons(app)
  installElementPlusX(app)
  installPermissionDirective(app)
  installSvgIcon(app)
}
