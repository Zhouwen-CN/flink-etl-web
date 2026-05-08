import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/** 全局权限判断函数，和权限指令 v-permission 功能类似 */
export function checkPermission(permissions: string[]): boolean {
  if (isArray(permissions) && permissions.length > 0) {
    const { permissions: userPermissions } = useUserStore()
    // 管理员所有权限
    if (userPermissions.includes("*")) {
      return true
    }
    return permissions.some(permission => userPermissions.includes(permission))
  } else {
    throw new Error(`参数必须是一个数组且长度大于 0，参考：v-permission="['admin', 'editor']"`)
  }
}
