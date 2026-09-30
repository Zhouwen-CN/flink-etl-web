<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateTableRequestData, TableData } from "../../apis/type"
import { cloneDeep } from "lodash-es"
import { createTableDataApi } from "../../apis/index"

const emit = defineEmits<{
  success: []
}>()

const loading = ref<boolean>(false)

const DEFAULT_FORM_DATA: CreateOrUpdateTableRequestData = {
  id: undefined,
  name: undefined,
  description: undefined,
  type: 1,
  projectId: undefined,
  clusterId: undefined,
  jarId: undefined,
  parallelism: 1,
  checkpointInterval: 30000,
  config: undefined
}

const dialogVisible = ref<boolean>(false)

const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateTableRequestData>(cloneDeep(DEFAULT_FORM_DATA))

const formRules: FormRules<CreateOrUpdateTableRequestData> = {
  name: [{ required: true, trigger: "blur", message: "请输入任务名称" }]
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    createTableDataApi(formData.value).then(() => {
      ElMessage.success("操作成功")
      dialogVisible.value = false
      emit("success")
    }).finally(() => {
      loading.value = false
    })
  })
}

function resetForm() {
  formRef.value?.clearValidate()
}

// 接收当前行数据，去除 id 和 name，其余字段保留作为新任务的默认值
function showDialog(row: TableData) {
  const data = cloneDeep(row)

  formData.value = {
    ...data,
    id: undefined,
    name: undefined,
    // 非流式任务，检查点间隔为空
    checkpointInterval: data.type !== 2 ? undefined : data.checkpointInterval
  }
  dialogVisible.value = true
}

defineExpose({
  showDialog
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="复制任务"
    width="30%"
    @closed="resetForm"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="right">
      <el-form-item prop="name" label="任务名称">
        <el-input v-model="formData.name" placeholder="请输入" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>
