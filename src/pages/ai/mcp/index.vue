<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateMcpServerRequestData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createMcpServerApi, deleteMcpServerApi, getMcpServerPageApi, syncMcpServerToolsApi, updateMcpServerApi } from "./apis/index"
import McpTool from "./components/McpTool/index.vue"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增/改
const DEFAULT_FORM_DATA: CreateOrUpdateMcpServerRequestData = {
  id: undefined,
  name: undefined,
  description: undefined,
  configJson: undefined
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateMcpServerRequestData>(cloneDeep(DEFAULT_FORM_DATA))

// 编辑时记录后端返回的脱敏配置，未修改或为空时不提交该字段
const originalConfigJson = ref<string>("")

const CONFIG_JSON_PLACEHOLDER = [
  "请输入 MCP 连接配置 JSON（仅支持远程传输），例如：",
  "{",
  "  \"mcpServers\": {",
  "    \"http-example\": {",
  "      \"type\": \"http\",",
  "      \"url\": \"https://example.com/mcp\"",
  "    }",
  "  }",
  "}"
].join("\n")

function validateConfigJson(_rule: unknown, value: string | undefined, callback: (error?: Error) => void) {
  // 新增时必填
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

const formRules: FormRules<CreateOrUpdateMcpServerRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入服务名称" }],
  configJson: [{ trigger: "blur", validator: validateConfigJson }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const form = { ...formData.value }
    // 更新时若配置未修改或为空，则不提交该字段（后端忽略 null，保留原值）
    if (form.id !== undefined && (!form.configJson || form.configJson === originalConfigJson.value)) {
      delete form.configJson
    }
    const api = form.id === undefined ? createMcpServerApi : updateMcpServerApi
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
  originalConfigJson.value = ""
}
// #endregion

// #region 删
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteMcpServerApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getTableData()
    })
  })
}
// #endregion

// #region 同步工具
const syncLoadingId = ref<number | undefined>(undefined)

function handleSync(row: TableData) {
  syncLoadingId.value = row.id
  syncMcpServerToolsApi(row.id).then(() => {
    ElMessage.success("同步成功")
  }).finally(() => {
    syncLoadingId.value = undefined
  })
}
// #endregion

// #region 改
function handleUpdate(row: TableData) {
  dialogVisible.value = true
  formData.value = cloneDeep(row)
  // 后端脱敏返回，仅在用户修改后提交
  originalConfigJson.value = row.configJson ?? ""
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
  getMcpServerPageApi({
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

// 工具抽屉
const mcpToolRef = ref<InstanceType<typeof McpTool>>()
function openDrawer(id: number) {
  mcpToolRef.value?.showDrawer(id)
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="searchName" label="服务名称">
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
        <el-table :data="tableData">
          <el-table-column prop="name" label="服务名称" align="center">
            <template #default="scope">
              <span class="server-name" @click="openDrawer(scope.row.id)">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="服务描述" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.description || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="configJson" label="连接配置JSON" align="center" show-overflow-tooltip />
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="220" align="center">
            <template #default="scope">
              <el-button
                type="success"
                text
                bg
                size="small"
                :loading="syncLoadingId === scope.row.id"
                @click="handleSync(scope.row)"
              >
                同步
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
      :title="formData.id === undefined ? '新增 MCP 服务' : '修改 MCP 服务'"
      width="40%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="right">
        <el-form-item prop="name" label="服务名称">
          <el-input v-model="formData.name" placeholder="请输入" maxlength="50" />
        </el-form-item>
        <el-form-item prop="description" label="服务描述">
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
    <McpTool ref="mcpToolRef" />
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

.server-name {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
