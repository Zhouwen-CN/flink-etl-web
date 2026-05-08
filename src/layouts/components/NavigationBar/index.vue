<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { UpdatePasswordRequestData } from "@/common/apis/users/type"
import Screenfull from "@@/components/Screenfull/index.vue"
import SearchMenu from "@@/components/SearchMenu/index.vue"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { useLayoutMode } from "@@/composables/useLayoutMode"
import { UserFilled } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { logoutApi, updatePasswordApi } from "@/common/apis/users"
import { useAppStore } from "@/pinia/stores/app"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { Breadcrumb, Hamburger, Sidebar } from "../index"

const { isMobile } = useDevice()

const { isTop } = useLayoutMode()

const router = useRouter()

const appStore = useAppStore()

const userStore = useUserStore()

const settingsStore = useSettingsStore()

const { showThemeSwitch, showScreenfull, showSearchMenu } = storeToRefs(settingsStore)

/** 切换侧边栏 */
function toggleSidebar() {
  appStore.toggleSidebar(false)
}

/** 登出 */
function logout() {
  const userId = useUserStore().userId
  if (userId) {
    logoutApi(userId)
  }
  userStore.logout()
  router.push("/login")
}

// #region 更新密码
const dialogVisible = ref<boolean>(false)
const loading = ref<boolean>(false)

const DEFAULT_FORM_DATA: UpdatePasswordRequestData = {
  oldPwd: "",
  newPwd: "",
  confirmPwd: ""
}
const formData = ref<UpdatePasswordRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRef = useTemplateRef("formRef")
const formRules: FormRules<UpdatePasswordRequestData> = {
  oldPwd: [{ required: true, trigger: "blur", message: "请输入旧密码" }],
  newPwd: [{ required: true, trigger: "blur", message: "请输入新密码" }],
  confirmPwd: [{ required: true, trigger: "blur", message: "请输入确认密码" }]
}

function handleUpdatePassword() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    updatePasswordApi(formData.value).then(() => {
      ElMessage.success("操作成功")
      dialogVisible.value = false
    }).finally(() => {
      loading.value = false
    })
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}
// #endregion 更新密码
</script>

<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="!isTop || isMobile"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="!isTop || isMobile" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <ThemeSwitch v-if="showThemeSwitch" class="right-menu-item" />
      <el-dropdown>
        <div class="right-menu-item user">
          <el-avatar :icon="UserFilled" :size="30" />
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="dialogVisible = true">
              修改密码
            </el-dropdown-item>
            <el-dropdown-item @click="logout">
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改密码"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="oldPwd" label="旧密码">
          <el-input v-model="formData.oldPwd" type="password" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="newPwd" label="新密码">
          <el-input v-model="formData.newPwd" type="password" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="confirmPwd" label="确认密码">
          <el-input v-model="formData.confirmPwd" type="password" placeholder="请输入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleUpdatePassword">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--v3-navigationbar-text-color);
  display: flex;
  justify-content: space-between;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    // 参考 Bootstrap 的响应式设计将宽度设置为 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    // 设置 min-width 是为了让 Sidebar 里的 el-menu 宽度自适应
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--el-color-primary);
        }
      }
    }
  }
  .right-menu {
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    &-item {
      margin: 0 10px;
      cursor: pointer;
      &:last-child {
        margin-left: 20px;
      }
    }
    .user {
      display: flex;
      align-items: center;
      .el-avatar {
        margin-right: 10px;
      }
      span {
        font-size: 16px;
      }
    }
  }
}
</style>
