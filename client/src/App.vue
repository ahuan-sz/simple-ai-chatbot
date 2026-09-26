<script setup>
import { RouterView, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue';
import { listConversation } from './api/index.js'

const router = useRouter();

// 假设已经登陆
const history = ref([]);
onMounted(() => {
  listConversation('123').then(res => {
    history.value = res.data.data;
  })
})

function goToHistory(convertId) {
  router.push(`/?convertId=${convertId}`)
}
</script>
<template>
  <div class="layout">
    <aside class="sidebar">
      <div
        v-for="item in history"
        :key="item.convertId"
        @click="goToHistory(item.convertId)"
      >
        {{ item.title }}
      </div>
    </aside>
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  justify-content: between;
}
.sidebar {
  flex-shrink: 0;
  width: 280px;
  padding: 10px;
  text-align: left;
  border: 1px solid #000;
}
.content {
  flex: 1;
}
</style>
