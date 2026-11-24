<script lang="ts" setup>
import type { FormRules, UploadInstance, UploadUserFile } from "element-plus"
import type { DocTableData } from "./apis/type"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { deleteDocApi, downloadDocApi, getDocPageApi, getKnowledgeSelectorApi, reparseDocApi, updateDocApi, uploadDocApi } from "./apis/index"
import DocChunk from "./components/DocChunk/index.vue"

const loading = ref<boolean>(false)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 知识库选择
const knowledgeOptions = ref<{ label: string, value: number }[]>([])

const knowledgeLoading = ref<boolean>(false)

function loadKnowledgeOptions() {
  knowledgeLoading.value = true
  getKnowledgeSelectorApi().then(({ data }) => {
    knowledgeOptions.value = data
  }).finally(() => {
    knowledgeLoading.value = false
  })
}

const selectedKnowledgeId = ref<number | undefined>(undefined)

// 支持从知识库列表页跳转：路由 query 携带 knowledgeId 时预筛选
const route = useRoute()
const routeKnowledgeId = Number(route.query.knowledgeId)
if (Number.isInteger(routeKnowledgeId) && routeKnowledgeId > 0) {
  selectedKnowledgeId.value = routeKnowledgeId
}

// 知识库字典映射：ID -> 名称（用于表格列渲染）
const knowledgeMap = computed(() => new Map(knowledgeOptions.value.map(item => [item.value, item.label])))

function handleKnowledgeChange(value: number | "") {
  // clearable 清空时返回空字符串，归一化为 undefined（查询全部）
  selectedKnowledgeId.value = value === "" ? undefined : value
  paginationData.currentPage === 1 ? getTableData() : (paginationData.currentPage = 1)
}
// #endregion

// #region 查
const tableData = ref<DocTableData[]>([])

const searchFormRef = useTemplateRef("searchFormRef")

const searchData = reactive({
  searchFileName: ""
})

function getTableData() {
  loading.value = true
  getDocPageApi({
    knowledgeId: selectedKnowledgeId.value,
    currentPage: paginationData.currentPage,
    pageSize: paginationData.pageSize,
    searchFileName: searchData.searchFileName || undefined
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

// #region 上传/修改文档
const DEFAULT_UPLOAD_FORM = {
  docId: undefined as unknown as number,
  knowledgeId: undefined as unknown as number,
  file: undefined as unknown as UploadUserFile
}

const uploadDialogVisible = ref<boolean>(false)

const uploadFormRef = useTemplateRef("uploadFormRef")

const uploadRef = ref<UploadInstance>()

const uploadForm = ref(cloneDeep(DEFAULT_UPLOAD_FORM))

function validateFile(_rule: unknown, value: UploadUserFile | undefined, callback: (error?: Error) => void) {
  value ? callback() : callback(new Error("请选择文档文件"))
}

const uploadFormRules: FormRules<typeof uploadForm.value> = {
  knowledgeId: [{ required: true, trigger: "change", message: "请选择知识库" }],
  file: [{ trigger: "change", validator: validateFile }]
}

function openUploadDialog() {
  uploadDialogVisible.value = true
  // 默认选中当前搜索的知识库
  if (selectedKnowledgeId.value !== undefined) {
    uploadForm.value.knowledgeId = selectedKnowledgeId.value
  }
}

function handleUpdateDoc(row: DocTableData) {
  uploadDialogVisible.value = true
  uploadForm.value.docId = row.id
  uploadForm.value.knowledgeId = row.knowledgeId
}

function handleFileChange(file: UploadUserFile) {
  uploadForm.value.file = file
}

function resetUploadForm() {
  uploadFormRef.value?.clearValidate()
  uploadForm.value = cloneDeep(DEFAULT_UPLOAD_FORM)
  uploadRef.value?.clearFiles()
}

function handleUpload() {
  uploadFormRef.value?.validate((valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    const formData = new FormData()
    const isEdit = uploadForm.value.docId !== undefined
    if (isEdit) {
      formData.append("docId", uploadForm.value.docId.toString())
    } else {
      formData.append("knowledgeId", uploadForm.value.knowledgeId.toString())
    }
    formData.append("file", uploadForm.value.file.raw as Blob)
    const api = isEdit ? updateDocApi : uploadDocApi
    api(formData).then(() => {
      ElMessage.success(isEdit ? "修改成功，解析中" : "上传成功，解析中")
      dialogVisibleRefresh()
    }).finally(() => {
      loading.value = false
    })
  })
}

function dialogVisibleRefresh() {
  uploadDialogVisible.value = false
  paginationData.currentPage === 1 ? getTableData() : (paginationData.currentPage = 1)
}
// #endregion

// #region 下载
const downloadingId = ref<number | undefined>(undefined)

function handleDownload(row: DocTableData) {
  downloadingId.value = row.id
  downloadDocApi(row.id).then((blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = row.fileName
    link.click()
    URL.revokeObjectURL(url)
  }).finally(() => {
    downloadingId.value = undefined
  })
}
// #endregion

// #region 重新解析/删
const reparseLoadingId = ref<number | undefined>(undefined)

function handleReparse(row: DocTableData) {
  ElMessageBox.confirm(`正在重新解析文档：${row.fileName}，将清除原有分块与向量数据，确认继续？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    reparseLoadingId.value = row.id
    reparseDocApi(row.id).then(() => {
      ElMessage.success("已提交重新解析")
      getTableData()
    }).finally(() => {
      reparseLoadingId.value = undefined
    })
  })
}

function handleDelete(row: DocTableData) {
  ElMessageBox.confirm(`正在删除文档：${row.fileName}，将级联删除向量数据与分块，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDocApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getTableData()
    })
  })
}
// #endregion

// 解析状态展示
const parseStatusMap: Record<string, { label: string, type: "info" | "warning" | "success" | "danger" }> = {
  WAITING: { label: "等待中", type: "info" },
  PROCESSING: { label: "解析中", type: "warning" },
  SUCCESS: { label: "成功", type: "success" },
  FAILED: { label: "失败", type: "danger" }
}

// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })

onMounted(() => {
  loadKnowledgeOptions()
})

// 分块抽屉
const docChunkRef = ref<InstanceType<typeof DocChunk>>()
function openDrawer(row: DocTableData) {
  docChunkRef.value?.showDrawer(row)
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="knowledgeLoading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData" @submit.prevent="handleSearch">
        <el-form-item label="知识库">
          <el-select
            v-model="selectedKnowledgeId"
            placeholder="请选择"
            filterable
            clearable
            style="width: 180px"
            @change="handleKnowledgeChange"
          >
            <el-option v-for="item in knowledgeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="searchFileName" label="文件名">
          <el-input v-model="searchData.searchFileName" placeholder="请输入" clearable style="width: 180px" />
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
          <el-button type="primary" :icon="CirclePlus" @click="openUploadDialog">
            上传文档
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
          <el-table-column prop="fileName" label="文件名" align="center">
            <template #default="scope">
              <span class="doc-name" @click="openDrawer(scope.row)">{{ scope.row.fileName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="知识库" align="center" width="140">
            <template #default="scope">
              {{ knowledgeMap.get(scope.row.knowledgeId) || scope.row.knowledgeId }}
            </template>
          </el-table-column>
          <el-table-column prop="fileType" label="文件类型" align="center" width="90" />
          <el-table-column prop="parseStatus" label="解析状态" align="center" width="100">
            <template #default="scope">
              <el-tooltip :content="scope.row.parseFailReason || ''" :disabled="scope.row.parseStatus !== 'FAILED'" placement="top">
                <el-tag :type="parseStatusMap[scope.row.parseStatus]?.type">
                  {{ parseStatusMap[scope.row.parseStatus]?.label || scope.row.parseStatus }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" align="center" />
          <el-table-column fixed="right" label="操作" width="280" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdateDoc(scope.row)">
                修改
              </el-button>
              <el-button type="success" text bg size="small" :loading="reparseLoadingId === scope.row.id" @click="handleReparse(scope.row)">
                解析
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
              <el-button type="info" text bg size="small" :loading="downloadingId === scope.row.id" @click="handleDownload(scope.row)">
                下载
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
    <DocChunk ref="docChunkRef" @changed="getTableData" />
    <!-- 上传/修改文档 -->
    <el-dialog
      v-model="uploadDialogVisible"
      :title="uploadForm.docId === undefined ? '上传文档' : '修改文档'"
      width="30%"
      @closed="resetUploadForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="90px" label-position="right">
        <el-form-item prop="knowledgeId" label="知识库">
          <el-select
            v-model="uploadForm.knowledgeId"
            placeholder="请选择"
            filterable
            clearable
            :disabled="uploadForm.docId !== undefined"
            style="width: 100%"
          >
            <el-option v-for="item in knowledgeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="file" label="文档文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            drag
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload">
              <upload-filled />
            </el-icon>
            <div class="el-upload__text">
              拖动文件到此处 或者 <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleUpload">
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

.doc-name {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
