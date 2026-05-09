<script lang="ts" setup>
interface Props {
  url: string
}

const { url } = defineProps<Props>()
</script>

<template>
  <div class="iframe-container">
    <iframe :src="url" frameborder="0" />
  </div>
</template>

<style lang="scss" scoped>
.iframe-container {
  width: 100%;
  height: 100%;
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}
</style>
