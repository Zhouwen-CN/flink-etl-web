<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { RunJobFormData } from "./apis/type"
import { cloneDeep } from "lodash-es"

import useDictionary from "@/common/composables/useDictionary"
import { getCheckpointSelectorDataApi, getJobInstanceSelectorDataAPi, getRunJobDataApi } from "./apis"

const loading = ref<boolean>(false)

// #region 增
const DEFAULT_FORM_DATA: RunJobFormData = {
  id: undefined,
  type: undefined,
  status: undefined,
  savepointPath: undefined,
  jobInstanceId: undefined
}

const formRef = useTemplateRef("formRef")
const formRules: FormRules<RunJobFormData> = {
  jobInstanceId: [{ required: true, trigger: "blur", message: "请选择任务实例ID" }],
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
  getJobInstanceSelectorData(formData.value.id)
}

function handlerSelectorChange(value: any) {
  getCheckpointSelectorData({
    instanceId: value
  })
}

const { dictData: jobInstanceSelectorData, run: getJobInstanceSelectorData } = useDictionary(getJobInstanceSelectorDataAPi)
const { dictData: checkpointSelectorData, run: getCheckpointSelectorData } = useDictionary(getCheckpointSelectorDataApi)

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
        <el-form-item prop="jobInstanceSelector" label="任务实例" v-if="formData.status">
          <el-select v-model="formData.jobInstanceId" placeholder="请选择" @change="handlerSelectorChange">
            <el-option v-for="item in jobInstanceSelectorData" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="savepointPath" label="保存点路径" v-if="formData.status">
          <el-select v-model="formData.savepointPath" placeholder="请选择">
            <el-option v-for="item in checkpointSelectorData" :key="item.value" :label="item.label" :value="item.value" />
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
.el-alert {
  margin-bottom: 20px;
}

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
