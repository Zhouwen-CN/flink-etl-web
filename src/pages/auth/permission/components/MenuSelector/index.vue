<script lang="ts" setup>
import { dynamicRoutes } from "@/router/index"

const model = defineModel<string>()
</script>

<template>
  <el-tree-select
    v-model="model"
    :data="dynamicRoutes"
    node-key="name"
    style="width: 240px"
    default-expand-all
    clearable
    :props="{
      label: (item) => item.meta.title,
    }"
  />
</template>
