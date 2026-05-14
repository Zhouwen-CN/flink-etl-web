<script lang="ts" setup>
import type { TableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { Refresh, Search } from "@element-plus/icons-vue"
import { getDictionaryDataApi } from "@/common/apis/dict"
import useDictionary from "@/common/composables/useDictionary"
import { deleteJobInstanceDataApi, getClusterSelectorDataApi, getJarSelectorDataApi, getJobSelectorDataApi, getStatusSelectorDataApi, getStopjobDataApi, getTableDataApi } from "./apis"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 查
const tableData = ref<TableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  instanceId: undefined,
  clusterId: undefined,
  jobId: undefined,
  jobType: undefined,
  status: undefined
})

function getTableData() {
  loading.value = true
  getTableDataApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    instanceId: searchData.instanceId,
    clusterId: searchData.clusterId,
    jobId: searchData.jobId,
    jobType: searchData.jobType,
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

// 停止任务
function handleStop(row: TableData) {
  ElMessageBox.confirm(`正在停止任务实例：${row.id}，确认停止？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    loading.value = true
    getStopjobDataApi(row.id).then(() => {
      ElMessage.success("操作成功")
    }).finally(() => {
      loading.value = false
    })
  })
}

// 删除任务实例
function handleDelete(row: TableData) {
  ElMessageBox.confirm(`正在删除记录：${row.id}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteJobInstanceDataApi(row.id).then(() => {
      ElMessage.success("操作成功")
      getTableData()
    })
  })
}

// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })

const { dictData: jobTypeSelectorData, dictMap: jobTypeSelectorMap, run: getJobTypeSelectorData } = useDictionary(getDictionaryDataApi)
const { dictData: clusterSelectorData, dictMap: clusterSelectorMap, run: getClusterSelectorData } = useDictionary(getClusterSelectorDataApi)
const { dictData: jobIdSelectorData, dictMap: jobIdSelectorMap, run: getJobIdSelectorData } = useDictionary(getJobSelectorDataApi)
const { dictData: statusSelectorData, run: getStatusSelectorData } = useDictionary(getStatusSelectorDataApi)
const { dictMap: jarSelectorMap, run: getJarSelectorData } = useDictionary(getJarSelectorDataApi)

onMounted(() => {
  getJobTypeSelectorData("job_type")
  getClusterSelectorData()
  getJobIdSelectorData()
  getStatusSelectorData()
  getJarSelectorData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :model="searchData">
        <el-row>
          <el-col :span="6">
            <el-form-item prop="instanceId" label="实例ID">
              <el-input v-model="searchData.instanceId" placeholder="请输入" style="width: 150px" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item prop="clusterId" label="集群名称">
              <el-select v-model="searchData.clusterId" placeholder="请选择" style="width: 150px">
                <el-option v-for="item in clusterSelectorData" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item prop="jobId" label="任务名称">
              <el-select v-model="searchData.jobId" placeholder="请选择" style="width: 150px">
                <el-option v-for="item in jobIdSelectorData" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item prop="jobType" label="任务类型">
              <el-select v-model="searchData.jobType" placeholder="请选择" style="width: 150px">
                <el-option v-for="item in jobTypeSelectorData" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item prop="status" label="任务状态">
              <el-select v-model="searchData.status" placeholder="请选择" style="width: 150px">
                <el-option v-for="item in statusSelectorData" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

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
      <div class="table-wrapper">
        <el-table :data="tableData" show-overflow-tooltip>
          <el-table-column prop="id" label="任务实例ID" align="center" />
          <el-table-column prop="clusterId" label="集群名称" align="center">
            <template #default="scope">
              {{ clusterSelectorMap.get(scope.row.clusterId) }}
            </template>
          </el-table-column>
          <el-table-column prop="jobId" label="任务名称" align="center">
            <template #default="scope">
              {{ jobIdSelectorMap.get(scope.row.jobId) }}
            </template>
          </el-table-column>
          <el-table-column prop="jobType" label="任务类型" align="center">
            <template #default="scope">
              {{ jobTypeSelectorMap.get(scope.row.jobType) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="任务状态" align="center" />
          <el-table-column prop="startTime" label="开始时间" align="center" />
          <el-table-column prop="endTime" label="结束时间" align="center" />
          <el-table-column prop="duration" label="持续时间" align="center" />
          <el-table-column prop="jarId" label="jar包名称" align="center">
            <template #default="scope">
              {{ jarSelectorMap.get(scope.row.jarId) }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="warning" text bg size="small" @click="handleStop(scope.row)" :disabled="scope.row.status !== 'Running'">
                停止
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)" :disabled="scope.row.status !== 'Failed' && scope.row.status !== 'Canceled' && scope.row.status !== 'Finished'">
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

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
