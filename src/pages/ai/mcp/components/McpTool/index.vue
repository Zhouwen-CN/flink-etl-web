<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { McpToolTableData, UpdateMcpToolRequestData } from "../../apis/type"
import { usePagination } from "@@/composables/usePagination"
import { Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { getMcpToolPageApi, updateMcpToolApi } from "../../apis"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 改
const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<UpdateMcpToolRequestData>({
  id: 0,
  outputTemplate: null
})

const formRules: FormRules<UpdateMcpToolRequestData> = {}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    // 输出模板留空保存表示清空（后端传 null 表示清空）
    const form = { ...formData.value, outputTemplate: formData.value.outputTemplate || null }
    updateMcpToolApi(form).then(() => {
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
}

function handleUpdate(row: McpToolTableData) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    outputTemplate: row.outputTemplate
  }
}
// #endregion

// #region 查
const tableData = ref<McpToolTableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  serverId: -1,
  searchName: ""
})

function getTableData() {
  loading.value = true
  getMcpToolPageApi({
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    serverId: searchData.serverId,
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
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData)

// 打开抽屉
const drawer = ref<boolean>(false)
function showDrawer(serverId: number) {
  drawer.value = true
  searchData.serverId = serverId
  paginationData.currentPage === 1 ? getTableData() : (paginationData.currentPage = 1)
}

defineExpose({
  showDrawer
})
</script>

<template>
  <el-drawer v-model="drawer" title="MCP 工具" size="55%">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="searchName" label="工具名">
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
        <div />
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData">
          <el-table-column prop="name" label="工具名" align="center" show-overflow-tooltip />
          <el-table-column prop="description" label="工具描述" align="center" show-overflow-tooltip />
          <el-table-column prop="updateTime" label="最近同步时间" align="center" />
          <el-table-column fixed="right" label="操作" width="120" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
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
    <!-- 修改 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改工具"
      width="40%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="right">
        <el-form-item prop="outputTemplate" label="自定义输出模板">
          <el-input
            v-model="formData.outputTemplate"
            type="textarea"
            :rows="6"
            placeholder="请输入自定义输出模板，{result} 引用工具结果，留空表示不对工具结果进行加工"
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
  </el-drawer>
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
