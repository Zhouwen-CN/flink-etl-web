<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateKnowledgeRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { createKnowledgeApi, deleteKnowledgeApi, getKnowledgePageApi, updateKnowledgeApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const router = useRouter()

// #region 增/改
const DEFAULT_FORM_DATA: CreateOrUpdateKnowledgeRequestData = {
  id: undefined,
  name: undefined,
  description: undefined,
  chunkSize: 1000,
  overlapSize: 200
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateKnowledgeRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const isEdit = computed(() => formData.value.id !== undefined)

const formRules: FormRules<CreateOrUpdateKnowledgeRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入名称" }],
  chunkSize: [{ trigger: "change", validator: validateChunkSize }],
  overlapSize: [{ trigger: "change", validator: validateOverlapSize }]
}

function validateChunkSize(_rule: unknown, value: number | undefined, callback: (error?: Error) => void) {
  if (value === undefined || value === null) {
    callback()
    return
  }
  if (!Number.isInteger(value) || value < 50 || value > 10000) {
    callback(new Error("分块大小须为 50~10000 的整数"))
  } else {
    callback()
  }
}

function validateOverlapSize(_rule: unknown, value: number | undefined, callback: (error?: Error) => void) {
  if (value === undefined || value === null) {
    callback()
    return
  }
  if (!Number.isInteger(value) || value < 0 || value > 2000) {
    callback(new Error("重叠大小须为 0~2000 的整数"))
    return
  }
  if (formData.value.chunkSize !== undefined && formData.value.chunkSize !== null && value >= formData.value.chunkSize) {
    callback(new Error("重叠大小须小于分块大小"))
  } else {
    callback()
  }
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const form = { ...formData.value }
    const api = form.id === undefined ? createKnowledgeApi : updateKnowledgeApi
    api(form).then(() => {
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
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteKnowledgeApi(row.id).then(() => {
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
  searchName: ""
})

function getTableData() {
  loading.value = true
  getKnowledgePageApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    searchName: searchData.searchName || undefined
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
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="searchName" label="名称">
          <el-input v-model="searchData.searchName" placeholder="请输入" clearable style="width: 180px" />
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
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" show-overflow-tooltip>
          <el-table-column prop="name" label="名称" align="center">
            <template #default="scope">
              <el-link type="primary" @click="router.push({ path: '/ai/doc', query: { knowledgeId: scope.row.id } })">
                {{ scope.row.name }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center">
            <template #default="scope">
              {{ scope.row.description || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="chunkSize" label="分块大小" align="center" width="90" />
          <el-table-column prop="overlapSize" label="重叠大小" align="center" width="90" />
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
      :title="isEdit ? '修改知识库' : '新增知识库'"
      width="40%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="right">
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入" maxlength="50" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" maxlength="255" />
        </el-form-item>
        <el-form-item prop="chunkSize" label="分块大小">
          <el-input-number v-model="formData.chunkSize" :min="50" :max="10000" :step="100" step-strictly controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item prop="overlapSize" label="重叠大小">
          <el-input-number v-model="formData.overlapSize" :min="0" :max="2000" :step="50" step-strictly controls-position="right" style="width: 100%" />
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
