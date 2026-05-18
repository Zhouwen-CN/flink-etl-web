<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateTableRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Delete, Download, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createTableDataApi, deleteBatchTableDataApi, deleteTableDataApi, getTableDataApi, updateTableDataApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateTableRequestData = {
  id: undefined,
  typeId: undefined,
  label: undefined,
  value: undefined,
  sortId: 0
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateTableRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateTableRequestData> = {
  label: [{ required: true, trigger: "blur", message: "请输入字典标签" }],
  value: [{ required: true, trigger: "blur", message: "请输入字典值" }],
  sortId: [{ required: true, trigger: "blur", message: "请输入排序ID" }]
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
  formData.value.id = DEFAULT_FORM_DATA.id
  formData.value.label = DEFAULT_FORM_DATA.label
  formData.value.value = DEFAULT_FORM_DATA.value
  formData.value.sortId = DEFAULT_FORM_DATA.sortId
}
// #endregion

// #region 删
// id删除
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.label}，确认删除？`, "提示", {
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
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  name: "",
  typeId: -1
})

function getTableData() {
  loading.value = true
  getTableDataApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    name: searchData.name,
    typeId: searchData.typeId
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
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData)

// 打开抽屉
const drawer = ref<boolean>(false)
function showDrawer(typeId: number) {
  drawer.value = true
  formData.value.typeId = typeId
  searchData.typeId = typeId
  getTableData()
}

defineExpose({
  showDrawer
})
</script>

<template>
  <el-drawer v-model="drawer" title="字典数据" size="50%">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="name" label="字典标签">
          <el-input v-model="searchData.name" placeholder="请输入" />
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
          <el-table-column prop="label" label="字典标签" align="center" />
          <el-table-column prop="value" label="字典值" align="center" />
          <el-table-column prop="sortId" label="排序" align="center" />
          <el-table-column fixed="right" label="操作" width="250" align="center">
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
        <el-form-item prop="label" label="字典标签">
          <el-input v-model="formData.label" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="value" label="字典值">
          <el-input v-model="formData.value" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="sortId" label="排序">
          <el-input v-model="formData.sortId" type="number" placeholder="请输入" />
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
  </el-drawer>
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
