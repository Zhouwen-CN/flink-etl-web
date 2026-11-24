<script lang="ts" setup>
import SvgFold from "@@/assets/icons/sidebar-close.svg?component"
import SvgExpand from "@@/assets/icons/sidebar-open.svg?component"

interface Props {
  isActive?: boolean
}

const { isActive = false } = defineProps<Props>()

const emit = defineEmits<{
  toggleClick: []
}>()

function toggleClick() {
  emit("toggleClick")
}
</script>

<template>
  <div @click="toggleClick">
    <SvgFold v-if="isActive" class="icon" />
    <SvgExpand v-else class="icon" />
  </div>
</template>

<style lang="scss" scoped>
.icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  color: var(--v3-hamburger-text-color);
}
</style>
