<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateModelRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { createModelApi, deleteModelApi, getModelPageApi, testModelApi, updateModelApi } from "./apis/index"

// 接口格式下拉（字典 ai_api_format）
const { dictData: formatOptions, dictMap: formatMap, run: getFormatOptions } = useDictionary(getDictionaryDataApi)

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateModelRequestData = {
  id: undefined,
  name: undefined,
  format: undefined,
  baseUrl: undefined,
  apiKey: undefined,
  modelName: undefined
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateModelRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateModelRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入模型唯一标识" }],
  format: [{ required: true, trigger: "change", message: "请选择接口格式" }],
  baseUrl: [{ required: true, trigger: "blur", message: "请输入请求地址" }],
  // 修改时留空表示不修改，仅在新增时必填
  apiKey: [{
    trigger: "blur",
    validator: (_rule, value: string | undefined, callback: (error?: Error) => void) => {
      formData.value.id === undefined && !value ? callback(new Error("请输入 API KEY")) : callback()
    }
  }],
  modelName: [{ required: true, trigger: "blur", message: "请输入模型名称" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    // 更新时若未填写 apiKey，则不提交该字段（后端忽略 null，保留原值）
    const form = { ...formData.value }
    if (form.id !== undefined && !form.apiKey) {
      delete form.apiKey
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
        <el-table :data="tableData">
          <el-table-column prop="name" label="模型标识" align="center" />
          <el-table-column label="接口格式" align="center">
            <template #default="scope">
              {{ formatMap.get(scope.row.format) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="modelName" label="模型名称" align="center" />
          <el-table-column prop="baseUrl" label="请求地址" align="center" show-overflow-tooltip />
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
        <el-form-item prop="format" label="接口格式">
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
            :placeholder="formData.id === undefined ? '请输入' : '留空则不修改'"
            maxlength="1000"
            show-password
          />
        </el-form-item>
        <el-form-item prop="modelName" label="模型名称">
          <el-input v-model="formData.modelName" placeholder="如 gpt-4o-mini" maxlength="64" />
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
