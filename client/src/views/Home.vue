<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MarkDown from '../components/MarkDown.vue';
import { createConversation, getConversation, requestLLM, requestPicLLM,uploadImage } from '../api/index.js'
import WmCard from '../components/WmCard.vue';


const route = useRoute();
const router = useRouter();

const inputValue = ref('');
const convertList = ref([]);
const isThinking = ref(false);
const picBase64 = ref('');
// 从路由 query 读取 userId，缺省回退为 '123'（满足"默认加上 userId 为 123"的需求）
const userId = route.query.userId || '123'

const modelType = ref('text')
function changeModel(type) {
  modelType.value = type
}

function sendToLLM(word) {
  const _convertList = [...convertList.value];
  let _word = word
  if (picBase64.value) {
    _word = [
      {
        type: "image_url",
        image_url: picBase64.value
      },
      {
        type: "text",
        text: word
      }
    ]
  }
  _convertList.push({
    role: 'user',
    content: _word
  });
  convertList.value = _convertList;
  isThinking.value = true;

  if (modelType === 'text') {
    requestLLM(userId, route.query.convertId, _word, (event) => {
      isThinking.value = false;
      const assistantObj = JSON.parse(event.data)
      console.log(assistantObj)
      const _convertList = [...convertList.value]
      const convertIndex = _convertList.findIndex((item) => {
        return item.id === assistantObj.id && item.id && assistantObj.id
      })

      if (convertIndex !== -1) {
        // 已存在则替换（每次 SSE 推送的是累积后的完整对象，替换即产生打字机效果）
        _convertList[convertIndex] = assistantObj
      } else {
        isThinking.value = false;
        _convertList.push(assistantObj)
      }
      // 关键：把副本写回 ref，触发 Vue 响应式更新，模板才会重渲染
      convertList.value = _convertList
    })
  } else {
    requestPicLLM(userId, route.query.convertId, _word).then(res => {
      isThinking.value = false;
      const _convertList = [...convertList.value];
      _convertList.push(res.data)
      convertList.value = _convertList;
    })
  }
}

function getDetailById(convertId) {
  getConversation(userId, convertId).then(res => {
    convertList.value = res.data.data.list;
  })
}

function startNewConversation() {
  createConversation(userId).then(res => {
    // 跳转时把 userId 也带到 URL，保证刷新后仍可读取
    router.push(`/?userId=${userId}&convertId=${res.data.data.convertId}`)
  })
}

function uploadFile(e) {
  const file = e.target.files[0];
  uploadImage(file).then(res => {
    picBase64.value = res.data.data.imageBase64;
  })
}

onMounted(() => {
  const convertId = route.query.convertId;
  if(convertId) {
    getDetailById(convertId);
  } else {
    startNewConversation()
  }
})

watch(route, () => {
  const convertId = route.query.convertId;
  if(convertId) {
    getDetailById(convertId);
  }
})
</script>

<template>
  <div class="chat-wrapper">
    <div class="chat-content">
      <div v-for="(chatItem, index) in convertList" :key="index" class="chat-item">
        <div v-if="chatItem.content !==''" class="chat-item__wrap">
          <div v-if="chatItem.role === 'user'" class="user-content">
            <MarkDown :content="chatItem.content" />
          </div>
          <div v-if="chatItem.role === 'assistant'" class="assistant-content">
            <MarkDown :content="chatItem.content" />
          </div>
          <div v-if="chatItem.role === 'tool' && chatItem.cardName" class="assistant-content">
            <WmCard v-if="chatItem.cardName === 'wm_card'" :kind="chatItem.arguments.kind" :cardData="chatItem.arguments.data" @cardConfirm="sendToLLM" />
          </div>
        </div>
      </div>
      <div v-if="isThinking" class="chat-item">
        <div class="chat-item__wrap">
          <div class="assistant-content">思考中...</div>
        </div>
      </div>
    </div>
    <div class="input-content">
      <input type="text" v-model="inputValue" />
      <button type="submit" @click="sendToLLM(inputValue)">发送</button>
      <button @click="startNewConversation()">新建会话</button>
      <input class="upload-btn" type="file" @change="uploadFile" />
    </div>
    <div>
      <button @click="changeModel('text')">文本模式</button>
      <button @click="changeModel('pic')">图片模式</button>
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.chat-content {
  flex: 1;
  overflow: auto;
}
.input-content {
  display: flex;
  padding: 10px;
}
.input-content button {
  margin-left: 10px;
}
.input-content input {
  flex: 1;
}
.chat-item {
  width: 100%;
  box-sizing: border-box;
}
.chat-item__wrap {
  display: flex;
  margin-bottom: 20px;
  padding: 10px;
}
.user-content {
  border-radius: 12px;
  padding: 0 8px;
  color: #fff;
  background-color: rgb(29, 120, 188);
  margin-left: auto;
  text-align: left;
}
.assistant-content {
  border-radius: 12px;
  padding: 0 8px;
  border: 1px solid grey;
  margin-right: auto;
  text-align: left;
}
.upload-btn {
  margin-left: 10px;
}
</style>
