import type { App, Directive } from "vue"
import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/**
 * @name 权限指令
 * @description 和权限判断函数 checkPermission 功能类似
 */
const permission: Directive = {
  mounted(el, binding) {
    const { value: permissions } = binding
    if (isArray(permissions) && permissions.length > 0) {
      const { permissions: userPermissions } = useUserStore()
      // 管理员所有权限
      if (userPermissions.includes("*")) {
        return
      }
      const hasPermission = (permissions as string[]).some(permission => userPermissions.includes(permission))
      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`参数必须是一个数组且长度大于 0，参考：v-permission="['admin', 'editor']"`)
    }
  }
}

export function installPermissionDirective(app: App) {
  app.directive("permission", permission)
}
