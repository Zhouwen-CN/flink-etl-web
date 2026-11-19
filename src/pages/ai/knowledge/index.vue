<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateKnowledgeRequestData, SelectorItem, TableData, UpdateKnowledgeRequestData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { createKnowledgeApi, deleteKnowledgeApi, getEmbedModelSelectorApi, getKnowledgePageApi, getVectorDbSelectorApi, updateKnowledgeApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 选择器数据
const vectorDbOptions = ref<SelectorItem[]>([])
const embedModelOptions = ref<SelectorItem[]>([])

const vectorDbMap = computed(() => new Map(vectorDbOptions.value.map(item => [item.value, item.label])))
const embedModelMap = computed(() => new Map(embedModelOptions.value.map(item => [item.value, item.label])))

function loadSelectors() {
  getVectorDbSelectorApi().then(({ data }) => {
    vectorDbOptions.value = data
  })
  getEmbedModelSelectorApi().then(({ data }) => {
    embedModelOptions.value = data
  })
}
// #endregion

// #region 增/改
const DEFAULT_FORM_DATA: CreateKnowledgeRequestData & { id?: number } = {
  id: undefined,
  name: undefined as unknown as string,
  description: undefined,
  vectorDbId: undefined as unknown as number,
  embedModelId: undefined as unknown as number,
  recallTopK: 5,
  minScore: 0.2
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateKnowledgeRequestData & { id?: number }>(cloneDeep(DEFAULT_FORM_DATA))

// 编辑模式下向量数据库/嵌入模型不可变更
const isEdit = computed(() => formData.value.id !== undefined)

const formRules = computed<FormRules<CreateKnowledgeRequestData & { id?: number }>>(() => ({
  name: [{ required: true, trigger: "blur", message: "请输入名称" }],
  vectorDbId: [{ required: !isEdit.value, trigger: "change", message: "请选择向量数据库" }],
  embedModelId: [{ required: !isEdit.value, trigger: "change", message: "请选择嵌入模型" }],
  recallTopK: [{ trigger: "change", validator: validateRecallTopK }],
  minScore: [{ trigger: "change", validator: validateMinScore }]
}))

function validateRecallTopK(_rule: unknown, value: number | undefined, callback: (error?: Error) => void) {
  if (value === undefined || value === null) {
    callback()
    return
  }
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    callback(new Error("最大召回条数须为 1~100 的整数"))
  } else {
    callback()
  }
}

function validateMinScore(_rule: unknown, value: number | undefined, callback: (error?: Error) => void) {
  if (value === undefined || value === null) {
    callback()
    return
  }
  if (value < 0 || value > 1) {
    callback(new Error("相似度下限须在 0~1 之间"))
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
    const requestPromise = isEdit.value
      ? updateKnowledgeApi({
        id: formData.value.id!,
        name: formData.value.name,
        description: formData.value.description,
        recallTopK: formData.value.recallTopK,
        minScore: formData.value.minScore
      } satisfies UpdateKnowledgeRequestData)
      : createKnowledgeApi({
          name: formData.value.name,
          description: formData.value.description,
          vectorDbId: formData.value.vectorDbId,
          embedModelId: formData.value.embedModelId,
          recallTopK: formData.value.recallTopK,
          minScore: formData.value.minScore
        })
    requestPromise.then(() => {
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
  formData.value = {
    id: row.id,
    name: row.name,
    description: row.description,
    vectorDbId: row.vectorDbId,
    embedModelId: row.embedModelId,
    recallTopK: row.recallTopK,
    minScore: row.minScore
  }
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

onMounted(() => {
  loadSelectors()
})
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
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="description" label="描述" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.description || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="vectorDbId" label="向量数据库" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ vectorDbMap.get(scope.row.vectorDbId) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="collectionName" label="集合名/索引名" align="center" show-overflow-tooltip />
          <el-table-column prop="embedModelId" label="嵌入模型" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ embedModelMap.get(scope.row.embedModelId) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="dimension" label="向量维度" align="center" width="90" />
          <el-table-column prop="recallTopK" label="最大召回" align="center" width="90" />
          <el-table-column prop="minScore" label="相似度下限" align="center" width="100" />
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
        <el-form-item prop="vectorDbId" label="向量数据库">
          <el-select v-model="formData.vectorDbId" :disabled="isEdit" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in vectorDbOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="embedModelId" label="嵌入模型">
          <el-select v-model="formData.embedModelId" :disabled="isEdit" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in embedModelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="recallTopK" label="最大召回条数">
          <el-input-number v-model="formData.recallTopK" :min="1" :max="100" :step="1" step-strictly controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item prop="minScore" label="相似度下限">
          <el-input-number v-model="formData.minScore" :min="0" :max="1" :step="0.05" :precision="2" controls-position="right" style="width: 100%" />
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
