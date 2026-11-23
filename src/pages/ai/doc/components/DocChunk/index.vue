<script lang="ts" setup>
import type { ChunkTableData, DocTableData, UpdateChunkRequestData } from "../../apis/type"
import { usePagination } from "@@/composables/usePagination"
import { Refresh, Search } from "@element-plus/icons-vue"
import { deleteChunkApi, getChunkPageApi, updateChunkApi } from "../../apis"

const emit = defineEmits<{
  changed: []
}>()

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 改
const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")

const formData = ref<UpdateChunkRequestData>({
  id: 0,
  content: ""
})

const formRules = {
  content: [{ required: true, trigger: "blur", message: "请输入分块内容" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    updateChunkApi(formData.value).then(() => {
      ElMessage.success("操作成功，已同步重新向量化")
      dialogVisible.value = false
      getTableData()
      emit("changed")
    }).finally(() => {
      loading.value = false
    })
  })
}

function resetForm() {
  formRef.value?.clearValidate()
}

function handleUpdate(row: ChunkTableData) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    content: row.content
  }
}
// #endregion

// #region 删
function handleDelete(row: ChunkTableData) {
  ElMessageBox.confirm(`正在删除分块：${row.id}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteChunkApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getTableData()
      emit("changed")
    })
  })
}
// #endregion

// #region 查
const tableData = ref<ChunkTableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  keyword: ""
})

function getTableData() {
  if (currentDoc.value === undefined) {
    return
  }
  loading.value = true
  getChunkPageApi({
    docId: currentDoc.value.id,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    keyword: searchData.keyword || undefined
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

const currentDoc = ref<DocTableData | undefined>(undefined)

function showDrawer(doc: DocTableData) {
  drawer.value = true
  currentDoc.value = doc
  paginationData.currentPage === 1 ? getTableData() : (paginationData.currentPage = 1)
}

defineExpose({
  showDrawer
})
</script>

<template>
  <el-drawer v-model="drawer" :title="`文档分块 - ${currentDoc?.fileName ?? ''}`" size="55%">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item prop="keyword" label="内容">
          <el-input v-model="searchData.keyword" placeholder="请输入" clearable style="width: 180px" />
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
      <div class="table-wrapper">
        <el-table :data="tableData" show-overflow-tooltip>
          <el-table-column prop="id" label="分块ID" align="center" width="90" />
          <el-table-column prop="content" label="分块内容" align="center" />
          <el-table-column prop="updateTime" label="更新时间" align="center" width="170" />
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
    <!-- 修改分块 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改分块"
      width="50%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" label-position="right">
        <el-form-item prop="content" label="分块内容">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="12"
            placeholder="请输入分块内容，保存后将同步重新向量化"
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

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
