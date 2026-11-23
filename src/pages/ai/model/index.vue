<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateModelRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { createModelApi, deleteModelApi, fetchModelOptionsApi, getModelPageApi, testModelApi, updateModelApi } from "./apis/index"

// 接口格式下拉（字典 ai_api_format）
const { dictData: formatOptions, dictMap: formatMap, run: getFormatOptions } = useDictionary(getDictionaryDataApi)

// 模型类型下拉（字典 ai_model_type）
const { dictData: typeOptions, dictMap: typeMap, run: getTypeOptions } = useDictionary(getDictionaryDataApi)

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateModelRequestData = {
  id: undefined,
  name: undefined,
  format: 1,
  type: 1,
  baseUrl: undefined,
  apiKey: undefined,
  modelName: undefined,
  contextWindow: undefined,
  supportImage: false
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateModelRequestData>(cloneDeep(DEFAULT_FORM_DATA))

// 上下文窗口快捷选项
const CONTEXT_WINDOW_OPTIONS = [
  { label: "128k", value: 128 * 1024 },
  { label: "256k", value: 256 * 1024 },
  { label: "512k", value: 512 * 1024 },
  { label: "1M", value: 1024 * 1024 }
]

const formRules: FormRules<CreateOrUpdateModelRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入模型唯一标识" }],
  format: [{ required: true, trigger: "change", message: "请选择接口格式" }],
  type: [{ required: true, trigger: "change", message: "请选择模型类型" }],
  baseUrl: [{ required: true, trigger: "blur", message: "请输入请求地址" }],
  apiKey: [{ required: true, trigger: "blur", message: "请输入 API KEY" }],
  modelName: [{ required: true, trigger: "blur", message: "请输入模型名称" }],
  contextWindow: [{ required: true, trigger: "change", message: "请选择上下文窗口" }]
}

// 仅模型类型为 1 时使用接口格式，隐藏时清空已选值
watch(() => formData.value.type, (type) => {
  if (type !== 1) {
    formData.value.format = undefined
    formRef.value?.clearValidate("format")
  }
})

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const form = { ...formData.value }
    // 输入非法数字时 v-model.number 会得到原始字符串，此时不提交该字段
    if (typeof form.contextWindow !== "number") {
      delete form.contextWindow
    }
    const api = form.id === undefined ? createModelApi : updateModelApi
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
  modelNameOptions.value = []
}
// #endregion

// #region 模型选择器
const modelNameOptions = ref<string[]>([])
const selectorLoading = ref<boolean>(false)

function handleFetchModels() {
  if (!formData.value.baseUrl) {
    ElMessage.warning("请先填写请求地址")
    return
  }
  selectorLoading.value = true
  // 后端获取失败时返回空列表，此时仍可手动输入；编辑模式 apiKey 留空时，后端通过 id 查库取原值
  fetchModelOptionsApi({
    id: formData.value.id,
    baseUrl: formData.value.baseUrl,
    apiKey: formData.value.apiKey
  }).then(({ data }) => {
    modelNameOptions.value = data
    if (data.length) {
      ElMessage.success(`获取成功，共 ${data.length} 个模型`)
    } else {
      ElMessage.warning("未获取到模型列表，请检查请求地址与 API KEY，或手动输入")
    }
  }).finally(() => {
    selectorLoading.value = false
  })
}
// #endregion

// #region 删
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteModelApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getTableData()
    })
  })
}
// #endregion

// #region 测试连通性
const testLoadingId = ref<number>()
function handleTest(row: TableData) {
  testLoadingId.value = row.id
  testModelApi(row.id).then(({ data }) => {
    ElMessageBox.alert(data || "（空响应）", `连通性测试：${row.name}`, {
      confirmButtonText: "确定",
      type: "success"
    })
  }).finally(() => {
    testLoadingId.value = undefined
  })
}
// #endregion

// #region 改
function handleUpdate(row: TableData) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  // 后端未返回值时的兜底显示
  formData.value.supportImage = row.supportImage ?? false
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  searchName: "",
  format: undefined as TableData["format"] | undefined
})

function getTableData() {
  loading.value = true
  getModelPageApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    searchName: searchData.searchName || undefined,
    format: searchData.format
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
  getFormatOptions("ai_api_format")
  getTypeOptions("ai_model_type")
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="searchName" label="模型标识">
          <el-input v-model="searchData.searchName" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item prop="format" label="接口格式">
          <el-select v-model="searchData.format" placeholder="请选择" clearable style="width: 220px">
            <el-option v-for="item in formatOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
          <el-table-column prop="name" label="模型标识" align="center" />
          <el-table-column prop="type" label="模型类型" align="center">
            <template #default="scope">
              {{ typeMap.get(scope.row.type) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="接口格式" align="center">
            <template #default="scope">
              {{ formatMap.get(scope.row.format) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="modelName" label="模型名称" align="center" />
          <el-table-column prop="baseUrl" label="请求地址" align="center" />
          <el-table-column label="上下文窗口" align="center">
            <template #default="scope">
              {{ scope.row.contextWindow ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="支持图片" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.supportImage ? 'success' : 'info'">
                {{ scope.row.supportImage ? "是" : "否" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="220" align="center">
            <template #default="scope">
              <el-button type="success" text bg size="small" :loading="testLoadingId === scope.row.id" @click="handleTest(scope.row)">
                测试
              </el-button>
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
      :title="formData.id === undefined ? '新增模型' : '修改模型'"
      width="35%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="right">
        <el-form-item prop="name" label="模型标识">
          <el-input v-model="formData.name" placeholder="请输入" maxlength="64" />
        </el-form-item>
        <el-form-item prop="type" label="模型类型">
          <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="format" label="接口格式">
          <el-select v-model="formData.format" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in formatOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="baseUrl" label="请求地址">
          <el-input v-model="formData.baseUrl" placeholder="如 https://api.openai.com/v1" maxlength="256" />
        </el-form-item>
        <el-form-item prop="apiKey" label="API KEY">
          <el-input
            v-model="formData.apiKey"
            placeholder="请输入"
            maxlength="1000"
            show-password
          />
        </el-form-item>
        <el-form-item prop="modelName" label="模型名称">
          <div class="model-name-wrapper">
            <el-select
              v-model="formData.modelName"
              placeholder="如 gpt-4o-mini，可手动输入"
              filterable
              allow-create
              default-first-option
              :loading="selectorLoading"
            >
              <el-option v-for="item in modelNameOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <el-tooltip content="获取模型列表" placement="top">
              <el-button :icon="RefreshRight" :loading="selectorLoading" @click="handleFetchModels" />
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item prop="contextWindow" label="上下文窗口">
          <div class="context-window-wrapper">
            <el-input v-model.number="formData.contextWindow" placeholder="请输入数值，留空则使用默认值" clearable />
            <el-link
              v-for="option in CONTEXT_WINDOW_OPTIONS"
              :key="option.label"
              type="primary"
              @click="formData.contextWindow = option.value"
            >
              {{ option.label }}
            </el-link>
          </div>
        </el-form-item>
        <el-form-item prop="supportImage" label="支持图片">
          <el-switch v-model="formData.supportImage" />
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

.model-name-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
  .el-select {
    flex: 1;
  }
}

.context-window-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .el-link {
    flex-shrink: 0;
    font-size: 12px;

    + .el-link {
      margin-left: 8px;
    }
  }
}
</style>
