<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateBotRequestData, DeptVO, McpSelectorNodeData, ModelSelectorOptionData, TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createBotApi, deleteBotApi, getBotKnowledgeIdsApi, getBotPageApi, getBotToolIdsApi, getDeptSelectorDataApi, getKnowledgeSelectorApi, getMcpSelectorApi, getModelSelectorApi, updateBotApi } from "./apis/index"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 模型选择器与部门树
const modelOptions = ref<ModelSelectorOptionData[]>([])
const modelMap = ref<Map<number, string>>(new Map<number, string>())

const deptTreeData = ref<DeptVO[]>([])

const mcpTreeData = ref<McpSelectorNodeData[]>([])

const knowledgeOptions = ref<ModelSelectorOptionData[]>([])

function getSelectors() {
  getModelSelectorApi().then(({ data }) => {
    modelOptions.value = data
    modelMap.value = new Map(data.map(item => [item.value, item.label]))
  })
  getDeptSelectorDataApi().then(({ data }) => {
    deptTreeData.value = data
  })
  getMcpSelectorApi().then(({ data }) => {
    mcpTreeData.value = data
  })
  getKnowledgeSelectorApi().then(({ data }) => {
    knowledgeOptions.value = data
  })
}
// #endregion

// #region 增/改
const DEFAULT_FORM_DATA: CreateOrUpdateBotRequestData = {
  id: undefined,
  name: undefined,
  modelId: undefined,
  temperature: 0.7,
  topP: 0.7,
  maxToolCalls: 100,
  systemPrompt: undefined,
  status: true,
  deptId: undefined,
  toolIds: [],
  knowledgeIds: []
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<CreateOrUpdateBotRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateBotRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入bot名称" }],
  modelId: [{ required: true, trigger: "change", message: "请选择模型" }],
  deptId: [{ required: true, trigger: "change", message: "请选择归属部门" }],
  maxToolCalls: [{ required: true, trigger: "change", message: "请选择最大工具调用次数" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const form = { ...formData.value }
    // 工具ID列表仅保留工具叶子节点（服务节点value为 server-{id} 字符串，勾选服务节点即全选其下工具）
    form.toolIds = (form.toolIds ?? []).filter((v): v is number => typeof v === "number")
    // 温度/Top-P 开关关闭时不提交对应字段（后端忽略 null，保留原值）
    if (!temperatureEnabled.value) {
      delete form.temperature
    }
    if (!topPEnabled.value) {
      delete form.topP
    }
    // 更新时若系统提示词为空，则不提交该字段（后端忽略 null，保留原值）
    if (form.id !== undefined && !form.systemPrompt) {
      delete form.systemPrompt
    }
    const api = form.id === undefined ? createBotApi : updateBotApi
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
  temperatureEnabled.value = false
  topPEnabled.value = false
}

// 温度/Top-P 开关：开启后才显示滑块，关闭时不提交对应字段
const temperatureEnabled = ref<boolean>(false)
const topPEnabled = ref<boolean>(false)
// #endregion

// #region 删
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteBotApi(row.id).then(() => {
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
  // 后端未返回值时，滑块兜底显示默认值 0.7
  formData.value.temperature = row.temperature ?? 0.7
  formData.value.topP = row.topP ?? 0.7
  temperatureEnabled.value = row.temperature !== undefined && row.temperature !== null
  topPEnabled.value = row.topP !== undefined && row.topP !== null
  // 工具ID列表：先清空，再根据bot ID查询回显
  formData.value.toolIds = []
  getBotToolIdsApi(row.id).then(({ data }) => {
    formData.value.toolIds = data
  })
  // 知识库ID列表：先清空，再根据bot ID查询回显
  formData.value.knowledgeIds = []
  getBotKnowledgeIdsApi(row.id).then(({ data }) => {
    formData.value.knowledgeIds = data
  })
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  searchName: "",
  modelId: undefined as number | undefined,
  status: undefined as boolean | undefined
})

function getTableData() {
  loading.value = true
  getBotPageApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    searchName: searchData.searchName || undefined,
    modelId: searchData.modelId,
    status: searchData.status
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
  getSelectors()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="searchName" label="Bot 名称">
          <el-input v-model="searchData.searchName" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item prop="modelId" label="模型">
          <el-select v-model="searchData.modelId" placeholder="请选择" clearable filterable style="width: 220px">
            <el-option v-for="item in modelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select v-model="searchData.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
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
          <el-table-column prop="name" label="Bot 名称" align="center" />
          <el-table-column label="模型" align="center">
            <template #default="scope">
              {{ modelMap.get(scope.row.modelId) || scope.row.modelId }}
            </template>
          </el-table-column>
          <el-table-column prop="temperature" label="温度" align="center" />
          <el-table-column prop="topP" label="Top-P" align="center" />
          <el-table-column prop="maxToolCalls" label="工具调用轮数" align="center" />
          <el-table-column label="状态" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status ? 'success' : 'danger'">
                {{ scope.row.status ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
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
      :title="formData.id === undefined ? '新增 Bot' : '修改 Bot'"
      width="35%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="130px" label-position="right">
        <el-form-item prop="name" label="Bot 名称">
          <el-input v-model="formData.name" placeholder="请输入" maxlength="50" />
        </el-form-item>
        <el-form-item prop="modelId" label="模型">
          <el-select v-model="formData.modelId" placeholder="请选择" filterable style="width: 100%">
            <el-option v-for="item in modelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="deptId" label="归属部门">
          <el-tree-select
            v-model="formData.deptId"
            :data="deptTreeData"
            node-key="id"
            default-expand-all
            check-strictly
            placeholder="请选择"
            :props="{
              label: 'name',
              children: 'children',
            }"
          />
        </el-form-item>
        <el-form-item prop="toolIds" label="工具列表">
          <el-tree-select
            v-model="formData.toolIds"
            :data="mcpTreeData"
            node-key="value"
            multiple
            show-checkbox
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            placeholder="请选择"
            :props="{
              label: 'label',
              children: 'children',
            }"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item prop="knowledgeIds" label="知识库">
          <el-select
            v-model="formData.knowledgeIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            placeholder="请选择"
            style="width: 100%"
          >
            <el-option v-for="item in knowledgeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="temperature" label="温度">
          <div class="slider-switch-wrapper">
            <el-switch v-model="temperatureEnabled" />
            <el-slider
              v-if="temperatureEnabled"
              v-model="formData.temperature"
              class="slider"
              :min="0"
              :max="2"
              :step="0.1"
              show-input
              :show-input-controls="false"
              input-size="small"
            />
          </div>
        </el-form-item>
        <el-form-item prop="topP" label="Top-P">
          <div class="slider-switch-wrapper">
            <el-switch v-model="topPEnabled" />
            <el-slider
              v-if="topPEnabled"
              v-model="formData.topP"
              class="slider"
              :min="0"
              :max="1"
              :step="0.1"
              show-input
              :show-input-controls="false"
              input-size="small"
            />
          </div>
        </el-form-item>
        <el-form-item prop="maxToolCalls" label="工具调用轮数">
          <el-input-number v-model="formData.maxToolCalls" :min="0" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item prop="systemPrompt" label="系统提示词">
          <el-input v-model="formData.systemPrompt" type="textarea" :rows="4" placeholder="请输入" maxlength="4000" show-word-limit />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-switch
            v-model="formData.status"
            inline-prompt
            active-icon="Check"
            inactive-icon="Close"
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

.slider-switch-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;

  .slider {
    width: 100%;
  }
}
</style>
