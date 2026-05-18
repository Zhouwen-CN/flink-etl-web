<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateTableRequestData, RoleSelectorData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Delete, Download, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { createTableDataApi, deleteBatchTableDataApi, deleteTableDataApi, getRoleIdsDataApi, getRoleSelectorDataApi, getTableDataApi, resetPasswordApi, revokeUserApi, updateTableDataApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateTableRequestData = {
  id: undefined,
  nickname: undefined,
  username: undefined,
  password: undefined,
  gender: 0,
  status: false,
  roleIds: []
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateTableRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateTableRequestData> = {
  nickname: [{ required: true, trigger: "blur", message: "请输入昵称" }],
  username: [{ required: true, trigger: "blur", message: "请输入用户名" }],
  password: [{ required: true, trigger: "blur", message: "请输入密码" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? createTableDataApi : updateTableDataApi
    api(formData.value).then(() => {
      ElMessage.success("操作成功")
      dialogVisible.value = false
      getTableData()
    }).finally(() => {
      loading.value = false
    })
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}
// #endregion

// #region 删
// id删除
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.username}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteTableDataApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getTableData()
    })
  })
}

// 批量删除
const selectedIds = ref<number[]>([])
function handleSelectionChange(users: TableData[]) {
  selectedIds.value = users.map(user => user.id)
}
function handleBathDelete() {
  ElMessageBox.confirm(`正在删除 ${selectedIds.value.length} 条记录，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteBatchTableDataApi({
      ids: selectedIds.value.join(",")
    }).then(() => {
      ElMessage.success("删除成功")
      getTableData()
    })
  })
}
// #endregion

// #region 改
function handleUpdate(row: TableData) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  getRoleIdsDataApi(row.id).then(({ data }) => {
    formData.value.roleIds = data
  })
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  username: ""
})

function getTableData() {
  loading.value = true
  getTableDataApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    username: searchData.username
  }).then(({ data }) => {
    paginationData.total = data.total
    tableData.value = data.list
  }).catch(() => {
    tableData.value = []
  }).finally(() => {
    loading.value = false
  })
}

function handleSearch() {
  paginationData.currentPage === 1 ? getTableData() : (paginationData.currentPage = 1)
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  handleSearch()
}
// #endregion

// #region 重置密码
function handleResetPassword(row: TableData) {
  ElMessageBox.confirm(`正在重置用户密码：${row.username}，确认重置？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    resetPasswordApi(row.id).then(() => {
      ElMessage.success("重置成功")
    })
  })
}
// #endregion

// #region 下线
function handleRevoke(row: TableData) {
  ElMessageBox.confirm(`正在下线用户：${row.username}，确认下线？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    revokeUserApi(row.id).then(() => {
      ElMessage.success("下线成功")
      getTableData()
    })
  })
}
// #endregion

// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })

const { dictData, dictMap, run } = useDictionary(getDictionaryDataApi)

const roleSelectorData = ref<RoleSelectorData[]>([])
onMounted(() => {
  getRoleSelectorDataApi().then(({ data }) => {
    roleSelectorData.value = data
  })
  run("gender")
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="searchData.username" placeholder="请输入" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" native-type="submit">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增记录
          </el-button>
          <el-button :disabled="selectedIds.length === 0" :icon="Delete" type="danger" @click="handleBathDelete">
            批量删除
          </el-button>
        </div>
        <div>
          <el-tooltip content="下载">
            <el-button type="primary" :icon="Download" circle />
          </el-tooltip>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="username" label="用户名" align="center" />
          <el-table-column prop="nickname" label="用户昵称" align="center" />
          <el-table-column prop="gender" label="性别" align="center">
            <template #default="scope">
              {{ dictMap.get(scope.row.gender) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status" type="success" effect="plain" disable-transitions>
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="plain" disable-transitions>
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="250" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="warning" text bg size="small" @click="handleResetPassword(scope.row)">
                重置
              </el-button>
              <el-button type="info" text bg size="small" @click="handleRevoke(scope.row)">
                下线
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增' : '修改'"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="right">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="formData.username" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="nickname" label="用户昵称">
          <el-input v-model="formData.nickname" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.id === undefined" prop="password" label="密码">
          <el-input v-model="formData.password" placeholder="请输入" type="password" />
        </el-form-item>
        <el-form-item prop="gender" label="性别">
          <el-select v-model="formData.gender" placeholder="请选择">
            <el-option v-for="item in dictData" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-switch
            v-model="formData.status"
            inline-prompt
            active-icon="Check"
            inactive-icon="Close"
          />
        </el-form-item>
        <el-form-item prop="roleIds" label="角色">
          <el-checkbox-group label="角色" v-model="formData.roleIds" :options="roleSelectorData" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.el-alert {
  margin-bottom: 20px;
}

.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
