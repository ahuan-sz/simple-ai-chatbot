<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkDown from '../components/MarkDown.vue'
import { createConversation, getConversation, requestLLM, requestPicLLM, uploadImage } from '../api/index.js'
import WmCard from '../components/WmCard.vue'
import {
  SendOutlined,
  PictureOutlined,
  UserOutlined,
  RobotOutlined,
  LoadingOutlined,
  ClearOutlined,
  ApiOutlined
} from '@ant-design/icons-vue'
import { h } from 'vue'

const route = useRoute()
const router = useRouter()

const inputValue = ref('')
const convertList = ref([])
const isThinking = ref(false)
const picBase64 = ref('')
const userId = route.query.userId || '123'
const chatContainerRef = ref(null)

const modelType = ref('text')

const segmentedOptions = [
  { label: '文本模式', value: 'text', icon: h(ApiOutlined) },
  { label: '图片模式', value: 'pic', icon: h(PictureOutlined) }
]

const fileList = ref([])
const uploading = ref(false)

const avatarMap = {
  user: { icon: h(UserOutlined), style: { backgroundColor: '#1677ff' } },
  assistant: { icon: h(RobotOutlined), style: { backgroundColor: '#52c41a' } },
  tool: { icon: h(RobotOutlined), style: { backgroundColor: '#faad14' } }
}

/** 过滤掉 SSE 流式推送中产生的空壳消息（content 为空且不是 tool 卡片） */
const displayList = computed(() => {
  return convertList.value.filter((item) => {
    if (item.role === 'tool' && item.cardName) return true
    if (item.content !== undefined && item.content !== null && item.content !== '') return true
    return false
  })
})

/** 发送消息给 LLM，支持文本/图片模式和混合内容 */
function sendToLLM(word) {
  if (!word && !picBase64.value) return

  const _convertList = [...convertList.value]
  let _word = word || ''

  if (picBase64.value) {
    _word = [
      { type: 'image_url', image_url: picBase64.value },
      { type: 'text', text: word || '' }
    ]
  }

  _convertList.push({ role: 'user', content: _word })
  convertList.value = _convertList
  isThinking.value = true
  inputValue.value = ''
  picBase64.value = ''
  fileList.value = []

  if (modelType.value === 'text') {
    requestLLM(userId, route.query.convertId, _word, (event) => {
      isThinking.value = false
      const assistantObj = JSON.parse(event.data)
      const _list = [...convertList.value]
      const convertIndex = _list.findIndex(
        (item) => item.id === assistantObj.id && item.id && assistantObj.id
      )

      if (convertIndex !== -1) {
        _list[convertIndex] = assistantObj
      } else {
        _list.push(assistantObj)
      }
      convertList.value = _list
      scrollToBottom()
    })
  } else {
    requestPicLLM(userId, route.query.convertId, _word)
      .then((res) => {
        isThinking.value = false
        const _list = [...convertList.value]
        _list.push(res.data)
        convertList.value = _list
        scrollToBottom()
      })
      .catch(() => {
        isThinking.value = false
      })
  }
}

/** 获取指定会话的历史消息 */
function getDetailById(convertId) {
  getConversation(userId, convertId).then((res) => {
    convertList.value = res.data.data.list
    scrollToBottom()
  })
}

/** 创建新会话并跳转 */
function startNewConversation() {
  createConversation(userId).then((res) => {
    convertList.value = []
    router.push(`/?userId=${userId}&convertId=${res.data.data.convertId}`)
  })
}

/** 上传图片，接收已有的 uploadImage 接口返回 base64 */
function uploadFile({ file, onSuccess, onError }) {
  uploading.value = true
  uploadImage(file)
    .then((res) => {
      picBase64.value = res.data.data.imageBase64
      uploading.value = false
      onSuccess?.()
    })
    .catch((err) => {
      uploading.value = false
      onError?.(err)
    })
}

/** 滚动到底部显示最新消息 */
function scrollToBottom() {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

/** 监听消息列表变化，自动跟随滚动（flush: 'post' 确保 DOM 更新完成后再滚动） */
watch(
  () => displayList.value.length + (displayList.value[displayList.value.length - 1]?.content || ''),
  () => {
    scrollToBottom()
  },
  { flush: 'post' }
)

/** 按下 Enter 发送，Shift+Enter 换行 */
function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendToLLM(inputValue.value)
  }
}

onMounted(() => {
  const convertId = route.query.convertId
  if (convertId) {
    getDetailById(convertId)
  } else {
    startNewConversation()
  }
})

watch(
  () => route.query.convertId,
  (newId) => {
    if (newId) {
      getDetailById(newId)
    }
  }
)
</script>

<template>
  <div class="chat-wrapper">
    <div ref="chatContainerRef" class="chat-content">
      <div
        v-for="(chatItem, index) in displayList"
        :key="chatItem.id || index"
        class="chat-item"
        :class="{ 'chat-item--user': chatItem.role === 'user' }"
      >
        <a-avatar
          class="chat-avatar"
          :style="avatarMap[chatItem.role]?.style || avatarMap.assistant.style"
        >
          <component :is="(avatarMap[chatItem.role]?.icon) || avatarMap.assistant.icon" />
        </a-avatar>

        <div class="chat-bubble" :class="`chat-bubble--${chatItem.role}`">
          <div v-if="chatItem.role === 'tool' && chatItem.cardName === 'wm_card'" class="chat-card-wrap">
            <WmCard
              :kind="chatItem.arguments?.kind"
              :cardData="chatItem.arguments?.data"
              @cardConfirm="sendToLLM"
            />
          </div>
          <template v-else-if="chatItem.content">
            <MarkDown :content="chatItem.content" />
          </template>
        </div>
      </div>

      <div v-if="isThinking" class="chat-item">
        <a-avatar class="chat-avatar" :style="{ backgroundColor: '#faad14' }">
          <LoadingOutlined />
        </a-avatar>
        <a-skeleton active :paragraph="{ rows: 2 }" class="thinking-skeleton" />
      </div>
    </div>

    <div class="input-area">
      <div class="input-toolbar">
        <div class="toolbar-left">
          <a-segmented
            v-model:value="modelType"
            :options="segmentedOptions"
            size="small"
          />
        </div>
        <div class="toolbar-right">
          <a-tooltip title="清空当前输入">
            <a-button
              size="small"
              :icon="h(ClearOutlined)"
              @click="inputValue = ''; picBase64 = ''; fileList = []"
            />
          </a-tooltip>
        </div>
      </div>

      <div class="input-row">
        <a-upload
          accept="image/*"
          :show-upload-list="true"
          :custom-request="uploadFile"
          :file-list="fileList"
          :before-upload="() => true"
          class="upload-btn"
        >
          <a-tooltip title="上传图片">
            <a-button :icon="h(PictureOutlined)" :loading="uploading" />
          </a-tooltip>
        </a-upload>

        <a-textarea
          v-model:value="inputValue"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
          :auto-size="{ minRows: 1, maxRows: 5 }"
          @keydown="handleEnter"
          class="chat-textarea"
        />

        <a-button
          type="primary"
          shape="circle"
          size="large"
          :icon="h(SendOutlined)"
          :disabled="!inputValue && !picBase64"
          @click="sendToLLM(inputValue)"
          class="send-btn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  width: 100%;
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 85%;
}

.chat-item--user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.chat-avatar {
  flex-shrink: 0;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  position: relative;
  word-break: break-word;
  text-align: left;
}

.chat-bubble--user {
  background: #1677ff;
  color: #fff;
  border-top-right-radius: 4px;
}

.chat-bubble--user :deep(p) {
  color: #fff;
}

.chat-bubble--assistant,
.chat-bubble--tool {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-top-left-radius: 4px;
}

.chat-card-wrap {
  width: 100%;
}

.thinking-skeleton {
  flex: 1;
  max-width: 70%;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}

.input-area {
  padding: 12px 24px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.upload-btn {
  flex-shrink: 0;
}

.chat-textarea {
  flex: 1;
  resize: none;
}

.send-btn {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .chat-content {
    padding: 16px;
  }

  .chat-item {
    max-width: 95%;
  }

  .input-area {
    padding: 10px 12px 16px;
  }
}
</style>
