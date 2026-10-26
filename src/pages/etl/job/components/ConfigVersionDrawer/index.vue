<script lang="ts" setup>
import type * as Monaco from "monaco-editor"
import type { ConfigVersionData } from "./apis/type"
import { monaco } from "@@/components/Editor/monaco"
import { useTheme } from "@@/composables/useTheme"
import { Top } from "@element-plus/icons-vue"
import { getConfigVersionListApi, rollbackConfigApi } from "./apis"

const emit = defineEmits<{
  success: []
}>()

const loading = ref<boolean>(false)
const drawerVisible = ref<boolean>(false)
const versionData = ref<ConfigVersionData[]>([])
const jobId = ref<number>()

function getVersionList() {
  loading.value = true
  getConfigVersionListApi({ jobId: jobId.value! }).then(({ data }) => {
    versionData.value = data || []
  }).catch(() => {
    versionData.value = []
  }).finally(() => {
    loading.value = false
  })
}

// 回滚到指定版本
function handleRollback(row: ConfigVersionData) {
  ElMessageBox.confirm(`正在回滚到版本 v${row.version}，确认回滚？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    loading.value = true
    rollbackConfigApi({
      jobId: jobId.value!,
      version: row.version
    }).then(() => {
      ElMessage.success("回滚成功")
      getVersionList()
      emit("success")
    }).finally(() => {
      loading.value = false
    })
  })
}

// #region 版本对比
const diffVisible = ref<boolean>(false)
const diffTitle = ref<string>("")
const diffEl = useTemplateRef("diffEl")
const newValue = ref<string>("")
const olderValue = ref<string>("")
let diffEditor: Monaco.editor.IStandaloneDiffEditor | null = null

const { activeThemeName } = useTheme()

function resolveTheme(name: string | undefined): string {
  return name === "dark" || name === "dark-blue" ? "vs-dark" : "vs"
}

// 以 { 或 [ 开头判定为 JSON，其余视为 YAML
function detectLanguage(value: string): "json" | "yaml" {
  const trimmed = value.trimStart()
  return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "yaml"
}

function destroyDiffEditor() {
  if (!diffEditor) return
  // 先销毁编辑器（内部会重置对模型的引用），再销毁模型；
  // 顺序颠倒会抛出 "TextModel got disposed before DiffEditorWidget model got reset"
  const original = diffEditor.getOriginalEditor().getModel()
  const modified = diffEditor.getModifiedEditor().getModel()
  diffEditor.dispose()
  original?.dispose()
  modified?.dispose()
  diffEditor = null
}

// 当前版本与上一版本对比（列表按版本倒序；最早版本与空字符串对比）
function handleCompare(row: ConfigVersionData, index: number) {
  const older = versionData.value[index + 1]
  newValue.value = row.config ?? ""
  olderValue.value = older?.config ?? ""
  diffTitle.value = older ? `v${older.version} 与 v${row.version} 配置对比` : `v${row.version} 配置对比`
  diffVisible.value = true
}

// 弹窗动画结束后创建 diff 编辑器（此时容器尺寸已稳定）
function initDiffEditor() {
  if (!diffEl.value) return
  destroyDiffEditor()
  diffEditor = monaco.editor.createDiffEditor(diffEl.value, {
    readOnly: true,
    theme: resolveTheme(activeThemeName.value),
    automaticLayout: true,
    renderSideBySide: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    stickyScroll: { enabled: false },
    renderOverviewRuler: false,
    wordWrap: "on",
    fontSize: 14,
    scrollbar: { verticalScrollbarSize: 8 }
  })
  // 左侧为旧版本（- 号标记被删除的行），右侧为新版本（+ 号标记新增的行）
  const language = detectLanguage(newValue.value)
  diffEditor.setModel({
    original: monaco.editor.createModel(olderValue.value, language),
    modified: monaco.editor.createModel(newValue.value, language)
  })
}

// 主题切换时同步 diff 编辑器（monaco 主题为全局设置，幂等）
watch(activeThemeName, (name) => {
  monaco.editor.setTheme(resolveTheme(name))
})

onBeforeUnmount(() => {
  destroyDiffEditor()
})
// #endregion

function showDrawer(id: number) {
  jobId.value = id
  versionData.value = []
  drawerVisible.value = true
  getVersionList()
}

defineExpose({
  showDrawer
})
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="配置版本"
    size="50%"
    :close-on-click-modal="false"
  >
    <el-table v-loading="loading" :data="versionData" show-overflow-tooltip>
      <el-table-column prop="version" label="版本号" align="center" min-width="90">
        <template #default="scope">
          <el-tooltip v-if="scope.$index === 0" content="最新版本" placement="top">
            <el-icon class="latest-icon">
              <Top />
            </el-icon>
          </el-tooltip>
          v{{ scope.row.version }}
        </template>
      </el-table-column>
      <el-table-column prop="operationType" label="操作类型" align="center" min-width="100" />
      <el-table-column prop="sourceVersion" label="回滚来源版本" align="center" min-width="120">
        <template #default="scope">
          {{ scope.row.sourceVersion ? `v${scope.row.sourceVersion}` : "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="createUser" label="创建者" align="center" min-width="100" />
      <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
      <el-table-column fixed="right" label="操作" width="140" align="center">
        <template #default="scope">
          <el-button type="primary" text bg size="small" @click="handleCompare(scope.row, scope.$index)">
            对比
          </el-button>
          <!-- 最新版本与任务表配置一致，回滚无意义 -->
          <el-button v-if="scope.$index !== 0" type="warning" text bg size="small" @click="handleRollback(scope.row)">
            回滚
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 版本对比 -->
    <el-dialog
      v-model="diffVisible"
      :title="diffTitle"
      width="70%"
      @opened="initDiffEditor"
      @closed="destroyDiffEditor"
    >
      <div ref="diffEl" class="diff-editor" />
    </el-dialog>
  </el-drawer>
</template>

<style lang="scss" scoped>
.latest-icon {
  color: var(--el-color-success);
  margin-right: 4px;
  vertical-align: -2px;
}

.diff-editor {
  width: 100%;
  height: 500px;
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}
</style>
