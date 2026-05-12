<script lang="ts" setup>
import type { CheckedInfo, FormRules, TreeInstance, TreeNodeData } from "element-plus"
import type { RouteRecordRaw } from "vue-router"
import type { CreateOrUpdateTableRequestData, PermissionSelectorData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Delete, Download, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { dynamicRoutes } from "@/router/index"
import { createTableDataApi, deleteBatchTableDataApi, deleteTableDataApi, getPermissionIdsApi, getPermissionSelectorApi, getTableDataApi, updateTableDataApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateTableRequestData = {
  id: undefined,
  name: undefined,
  code: undefined,
  permissionIds: []
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateTableRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateTableRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入角色名" }],
  code: [{ required: true, trigger: "blur", message: "请输入角色编码" }]
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
  ElMessageBox.confirm(`正在删除记录：${row.code}，确认删除？`, "提示", {
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
  formData.value = cloneDeep(row)
  getPermissionIdsApi(formData.value.id!).then(({ data }) => {
    // 数据回显，设置选中节点
    formData.value.permissionIds = data
    dialogVisible.value = true
    // 不用nextTick，对话款首次渲染的时候会拿不到数据
    nextTick(() => {
      treeRef.value?.setCheckedKeys(data)
    })
  })
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  roleName: ""
})

function getTableData() {
  loading.value = true
  getTableDataApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    roleName: searchData.roleName
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

// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })

// 树型控件ref
const treeRef = ref<TreeInstance>()
// 树节点数据
const treeNodes = ref<TreeNodeData[]>([])
// 树节点选中事件
function handlerCheck(_: any, checkedInfo: CheckedInfo) {
  // 非叶子节点key是string类型，叶子节点key是number类型，这样写会过滤掉非叶子节点
  formData.value.permissionIds = checkedInfo.checkedKeys.map(key => Number(key)).filter(key => key) as number[]
}

// 初始化树节点
function makeTree(routes: RouteRecordRaw[], permissionSelectorList: PermissionSelectorData[]): TreeNodeData[] {
  const result: TreeNodeData[] = []

  routes.forEach((route) => {
    let hasPermission = false
    const children: TreeNodeData[] = []

    if (route.children && route.children.length > 0) {
      // 有子路由，递归处理
      const subTree = makeTree(route.children, permissionSelectorList)
      if (subTree.length > 0) {
        hasPermission = true
        children.push(...subTree)
      }
    } else {
      // 叶子节点：检查权限
      permissionSelectorList.forEach((selector) => {
        if (selector.routeName === route.name) {
          hasPermission = true
          children.push({
            label: selector.name,
            value: selector.id
          })
        }
      })
    }

    if (hasPermission) {
      result.push({
        label: route.meta?.title,
        value: route.name,
        children
      })
    }
  })

  return result
}
onMounted(() => {
  getPermissionSelectorApi().then(({ data }) => {
    treeNodes.value = makeTree(dynamicRoutes, data)
  })
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" label="角色名">
          <el-input v-model="searchData.roleName" placeholder="请输入" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
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
          <el-table-column prop="name" label="角色名" align="center" />
          <el-table-column prop="code" label="角色编码" align="center" />
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
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
        <el-form-item prop="name" label="角色名">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="code" label="角色编码">
          <el-input v-model="formData.code" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="permissionIds" label="权限" max-width="600px">
          <el-tree
            @check="handlerCheck"
            ref="treeRef"
            highlight-current
            :data="treeNodes"
            show-checkbox
            node-key="value"
            style="width: 100%;"
          />
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
