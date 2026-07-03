<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateTableRequestData, TableData } from "./apis/type"
import Editor from "@@/components/Editor/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Delete, Download, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { createTableDataApi, deleteBatchTableDataApi, deleteTableDataApi, getClusterSelectorDataApi, getJarSelectorDataApi, getTableDataApi, updateTableDataApi } from "./apis/index"
import RunJobDialog from "./components/RunJobDialog/index.vue"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 增
const DEFAULT_FORM_DATA: CreateOrUpdateTableRequestData = {
  id: undefined,
  name: undefined,
  type: 1,
  clusterId: undefined,
  jarId: undefined,
  parallelism: 1,
  checkpointInterval: 30000,
  config: undefined
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")
const editorRef = useTemplateRef("editorRef")

const formData = ref<CreateOrUpdateTableRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateTableRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入昵称" }],
  clusterId: [{ required: true, trigger: "blur", message: "请选择集群ID" }],
  jarId: [{ required: true, trigger: "blur", message: "请选择JarID" }],
  config: [{ required: true, trigger: "blur", message: "请输入配置" }],
  type: [{ required: true, trigger: "blur", message: "请选择任务类型" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const api = formData.value.id === undefined ? createTableDataApi : updateTableDataApi
    // 非流式任务，检查点间隔为空
    if (formData.value.type !== 2) {
      formData.value.checkpointInterval = undefined
    }
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
  editorRef.value?.resetFullscreen()
}
// #endregion

// #region 删
// id删除
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.name}，确认删除？`, "提示", {
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
  formData.value.checkpointInterval ??= DEFAULT_FORM_DATA.checkpointInterval
}
// #endregion

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  name: "",
  type: undefined
})

function getTableData() {
  loading.value = true
  getTableDataApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    name: searchData.name,
    type: searchData.type
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

// #region 运行任务
const runJobDialogRef = ref<InstanceType<typeof RunJobDialog>>()
function handleRun(row: TableData) {
  runJobDialogRef.value?.showDialog(row.id, row.type)
}
// #endregion

// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })

const { dictData: clusterSelectorData, dictMap: clusterSelectorMap, run: getClusterSelectorData } = useDictionary(getClusterSelectorDataApi)
const { dictData: jarSelectorData, dictMap: jarSelectorMap, run: getJarSelectorData } = useDictionary(getJarSelectorDataApi)
const { dictData: jobTypeSelectorData, dictMap: jobTypeSelectorMap, run: getJobTypeSelectorData } = useDictionary(getDictionaryDataApi)
onMounted(() => {
  getClusterSelectorData()
  getJarSelectorData()
  getJobTypeSelectorData("job_type")
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="name" label="任务名称">
          <el-input v-model="searchData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="type" label="任务类型">
          <el-select v-model="searchData.type" placeholder="请选择" style="width: 150px" clearable>
            <el-option v-for="item in jobTypeSelectorData" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-table :data="tableData" @selection-change="handleSelectionChange" show-overflow-tooltip>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="任务名称" align="center" />
          <el-table-column prop="type" label="任务类型" align="center">
            <template #default="scope">
              {{ jobTypeSelectorMap.get(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="clusterId" label="flink集群" align="center">
            <template #default="scope">
              {{ clusterSelectorMap.get(scope.row.clusterId) }}
            </template>
          </el-table-column>
          <el-table-column prop="jarId" label="jar包" align="center">
            <template #default="scope">
              {{ jarSelectorMap.get(scope.row.jarId) }}
            </template>
          </el-table-column>
          <el-table-column prop="parallelism" label="并行度" align="center" />
          <el-table-column prop="checkpointInterval" label="检查点间隔" align="center">
            <template #default="scope">
              {{ scope.row.checkpointInterval ? `${scope.row.checkpointInterval}ms` : "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="250" align="center">
            <template #default="scope">
              <el-button type="success" text bg size="small" @click="handleRun(scope.row)">
                运行
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
      :title="formData.id === undefined ? '新增' : '修改'"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="right">
        <el-form-item prop="name" label="任务名称">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="type" label="任务类型">
          <el-select v-model="formData.type" placeholder="请选择">
            <el-option v-for="item in jobTypeSelectorData" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="clusterId" label="flink集群">
          <el-select v-model="formData.clusterId" placeholder="请选择">
            <el-option v-for="item in clusterSelectorData" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="jarId" label="jar包">
          <el-select v-model="formData.jarId" placeholder="请选择">
            <el-option v-for="item in jarSelectorData" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="parallelism" label="并行度">
          <el-input-number v-model="formData.parallelism" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.type === 2" prop="checkpointInterval" label="检查点间隔(ms)">
          <el-input-number v-model="formData.checkpointInterval" placeholder="请输入" />
        </el-form-item>

        <el-form-item prop="config" label="任务配置">
          <Editor ref="editorRef" v-model="formData.config" />
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

    <RunJobDialog
      ref="runJobDialogRef"
    />
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
