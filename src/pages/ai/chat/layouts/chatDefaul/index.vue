<!-- 默认消息列表页（迁移自 ruoyi-element-ai pages/chat/layouts/chatDefaul/index.vue）
  注：模板中原使用 UnoCSS 原子类，已重写为 scoped SCSS。
-->
<script setup lang="ts">
import type { FilesCardProps } from "vue-element-plus-x/types/FilesCard"
import { nextTick, ref, watch } from "vue"
import FilesSelect from "../../components/FilesSelect/index.vue"
import ModelSelect from "../../components/ModelSelect/index.vue"
import WelecomeText from "../../components/WelecomeText/index.vue"
import { useFilesStore } from "../../stores/files"
import { useSessionStore } from "../../stores/session"
import { useUserStore } from "../../stores/user"

const userStore = useUserStore()
const sessionStore = useSessionStore()
const filesStore = useFilesStore()

const senderValue = ref("")
const senderRef = ref()

async function handleSend() {
  localStorage.setItem("chatContent", senderValue.value)
  await sessionStore.createSessionList({
    userId: userStore.userInfo?.userId as number,
    sessionContent: senderValue.value,
    sessionTitle: senderValue.value.slice(0, 10),
    remark: senderValue.value.slice(0, 10)
  })
}

function handleDeleteCard(_item: FilesCardProps, index: number) {
  filesStore.deleteFileByIndex(index)
}

watch(
  () => filesStore.filesList.length,
  (val) => {
    if (val > 0) {
      nextTick(() => {
        senderRef.value.openHeader()
      })
    } else {
      nextTick(() => {
        senderRef.value.closeHeader()
      })
    }
  }
)
</script>

<template>
  <div class="chat-defaul-wrap">
    <WelecomeText />
    <Sender
      ref="senderRef"
      v-model="senderValue"
      class="chat-defaul-sender"
      :auto-size="{
        maxRows: 9,
        minRows: 3,
      }"
      variant="updown"
      clearable
      allow-speech
      @submit="handleSend"
    >
      <template #header>
        <div class="sender-header">
          <Attachments
            :items="filesStore.filesList"
            :hide-upload="true"
            @delete-card="handleDeleteCard"
          >
            <template #prev-button="{ show, onScrollLeft }">
              <div
                v-if="show"
                class="prev-next-btn prev-next-btn-left"
                @click="onScrollLeft"
              >
                <el-icon>
                  <ArrowLeftBold />
                </el-icon>
              </div>
            </template>

            <template #next-button="{ show, onScrollRight }">
              <div
                v-if="show"
                class="prev-next-btn prev-next-btn-right"
                @click="onScrollRight"
              >
                <el-icon>
                  <ArrowRightBold />
                </el-icon>
              </div>
            </template>
          </Attachments>
        </div>
      </template>
      <template #prefix>
        <div class="sender-prefix">
          <FilesSelect />
          <ModelSelect />
        </div>
      </template>
    </Sender>
  </div>
</template>

<style scoped lang="scss">
.chat-defaul-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  min-height: 450px;

  .chat-defaul-sender {
    width: 100%;
  }
}

.sender-header {
  padding: 6px 12px 0;
}

// 附件轮播左右按钮
.prev-next-btn {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transform: translateY(-50%);

  &:hover {
    background-color: var(--el-fill-color);
  }
}

.prev-next-btn-left {
  left: 8px;
}

.prev-next-btn-right {
  right: 8px;
}

.sender-prefix {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  width: fit-content;
  overflow: hidden;
}
</style>
