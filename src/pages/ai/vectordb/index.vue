<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateVectorDatabaseRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { createVectorDatabaseApi, deleteVectorDatabaseApi, getVectorDatabasePageApi, updateVectorDatabaseApi, verifyVectorDatabaseApi } from "./apis/index"

// 类型下拉（字典 ai_vectordb_type）
const { dictData: typeOptions, dictMap: typeMap, run: getTypeOptions } = useDictionary(getDictionaryDataApi)

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增/改
const DEFAULT_FORM_DATA: CreateOrUpdateVectorDatabaseRequestData = {
  id: undefined,
  name: undefined,
  type: undefined,
  description: undefined,
  configJson: undefined
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateVectorDatabaseRequestData>(cloneDeep(DEFAULT_FORM_DATA))

// 根据类型生成连接配置占位示例
const CONFIG_JSON_PLACEHOLDER = computed(() => {
  const common = [
    "请输入连接配置 JSON，例如：",
    "{",
    "  \"host\": \"127.0.0.1\",",
    "  \"port\": 6379,"
  ]
  if (formData.value.type === 2) {
    return [
      ...common,
      "  \"username\": \"YOUR_USERNAME\",",
      "  \"password\": \"YOUR_PASSWORD\",",
      "  \"databaseName\": \"YOUR_DATABASE\"",
      "}"
    ].join("\n")
  }
  return [
    ...common,
    "  \"username\": \"YOUR_USERNAME\",",
    "  \"password\": \"YOUR_PASSWORD\"",
    "}"
  ].join("\n")
})

function validateConfigJson(_rule: unknown, value: string | undefined, callback: (error?: Error) => void) {
  if (!value) {
    callback(new Error("请输入连接配置JSON"))
    return
  }

  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      callback(new Error("配置必须为 JSON 对象"))
    } else {
      callback()
    }
  } catch {
    callback(new Error("JSON 格式不正确"))
  }
}

const formRules: FormRules<CreateOrUpdateVectorDatabaseRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入名称" }],
  type: [{ required: true, trigger: "change", message: "请选择类型" }],
  configJson: [{ trigger: "blur", validator: validateConfigJson }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? createVectorDatabaseApi : updateVectorDatabaseApi
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

// #region 测试连接
const verifyLoadingId = ref<number>()

function handleVerify(row: TableData) {
  verifyLoadingId.value = row.id
  verifyVectorDatabaseApi({
    type: row.type,
    configJson: row.configJson
  }).then(() => {
    ElMessage.success(`连接验证成功：${row.name}`)
  }).finally(() => {
    verifyLoadingId.value = undefined
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
    deleteVectorDatabaseApi(row.id).then(() => {
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
  getVectorDatabasePageApi({
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
  getTypeOptions("ai_vectordb_type")
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
          <el-table-column prop="type" label="类型" align="center" width="120">
            <template #default="scope">
              <el-tag>{{ typeMap.get(scope.row.type) || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center">
            <template #default="scope">
              {{ scope.row.description || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="configJson" label="连接配置JSON" align="center" />
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="220" align="center">
            <template #default="scope">
              <el-button
                type="success"
                text
                bg
                size="small"
                :loading="verifyLoadingId === scope.row.id"
                @click="handleVerify(scope.row)"
              >
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
      :title="formData.id === undefined ? '新增向量数据库' : '修改向量数据库'"
      width="40%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="right">
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入" maxlength="50" />
        </el-form-item>
        <el-form-item prop="type" label="类型">
          <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" maxlength="255" />
        </el-form-item>
        <el-form-item prop="configJson" label="连接配置">
          <el-input
            v-model="formData.configJson"
            type="textarea"
            :rows="8"
            :placeholder="CONFIG_JSON_PLACEHOLDER"
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
