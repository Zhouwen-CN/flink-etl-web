<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CheckpointSelectorData, RunJobFormData } from "./apis/type"
import { cloneDeep } from "lodash-es"

import { getCheckpointSelectorDataApi, getRunJobDataApi } from "./apis"

const loading = ref<boolean>(false)

// #region 增
const DEFAULT_FORM_DATA: RunJobFormData = {
  id: undefined,
  type: undefined,
  status: undefined,
  savepointPath: undefined
}

const formRef = useTemplateRef("formRef")
const formRules: FormRules<RunJobFormData> = {
  savepointPath: [{ required: true, trigger: "blur", message: "请选择检查点路径" }]
}

const dialogVisible = ref<boolean>(false)

const formData = ref<RunJobFormData>(cloneDeep(DEFAULT_FORM_DATA))

function handleRunJob() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    getRunJobDataApi({
      id: formData.value.id,
      savepointPath: formData.value.savepointPath
    }).then(() => {
      loading.value = false
      dialogVisible.value = false
      ElMessage.success("操作成功")
    }).finally(() => {
      loading.value = false
    })
  })
}

function resetForm() {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

function showDialog(id: number, type: number) {
  dialogVisible.value = true
  formData.value.id = id
  formData.value.type = type
  formData.value.status = type === 2
  if (type === 2) {
    getCheckpointSelectorDataApi({ jobId: id }).then((res) => {
      checkpointSelectorData.value = res.data || []
    })
  }
}

const checkpointSelectorData = ref<CheckpointSelectorData[]>([])

/** 当前选中的检查点 */
const selectedCheckpoint = computed(() => {
  return checkpointSelectorData.value.find(item => item.path === formData.value.savepointPath)
})

defineExpose({
  showDialog
})
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增' : '修改'"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="right">
        <el-form-item prop="status" label="开启检查点">
          <el-switch
            v-model="formData.status"
            inline-prompt
            active-icon="Check"
            inactive-icon="Close"
            :disabled="formData.type === 1"
          />
        </el-form-item>

        <el-form-item prop="savepointPath" label="保存点路径" v-if="formData.status">
          <el-select v-model="formData.savepointPath" placeholder="请选择">
            <el-option
              v-for="item in checkpointSelectorData"
              :key="item.chkId"
              :label="`${item.type ? 'SP' : 'CP'} - ${item.triggerTime}`"
              :value="item.path"
            >
              <el-tag :type="item.type ? 'success' : 'primary'" size="small" effect="plain" disable-transitions>
                {{ item.type ? "SP" : "CP" }}
              </el-tag>
              <span style="margin-left: 8px;">
                {{ item.triggerTime }}
              </span>
            </el-option>
            <!-- 自定义选中后输入框显示内容，与下拉选项保持一致 -->
            <template #label>
              <el-tag v-if="selectedCheckpoint" :type="selectedCheckpoint.type ? 'success' : 'primary'" size="small" effect="plain" disable-transitions>
                {{ selectedCheckpoint.type ? "SP" : "CP" }}
              </el-tag>
              <span v-if="selectedCheckpoint" style="margin-left: 8px;">
                {{ selectedCheckpoint.triggerTime }}
              </span>
            </template>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleRunJob">
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
