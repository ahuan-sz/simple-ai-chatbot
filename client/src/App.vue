<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { h, onMounted, ref, computed } from 'vue'
import { listConversation, createConversation } from './api/index.js'
import {
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const history = ref([])
const selectedKey = ref('')
const collapsed = ref(false)

const menuItems = computed(() => {
  return history.value.map((item) => ({
    key: item.convertId,
    icon: () => h(MessageOutlined),
    label: item.title
  }))
})

/** 加载会话历史列表 */
async function loadHistory() {
  try {
    const res = await listConversation('123')
    history.value = res.data.data.reverse()
  } catch (e) {
    console.error('加载会话列表失败:', e)
  }
}

/** 点击侧边栏菜单项，切换到对应会话 */
function onMenuClick({ key }) {
  selectedKey.value = key
  router.push({ path: '/', query: { ...route.query, convertId: key } })
}

/** 新建会话 */
async function handleNewConversation() {
  try {
    const res = await createConversation('123')
    await loadHistory()
    router.push({
      path: '/',
      query: { userId: '123', convertId: res.data.data.convertId }
    })
  } catch (e) {
    console.error('新建会话失败:', e)
  }
}

onMounted(() => {
  loadHistory()
  if (route.query.convertId) {
    selectedKey.value = route.query.convertId
  }
})
</script>

<template>
  <a-layout class="app-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      theme="light"
      width="260"
      :trigger="null"
      class="app-sider"
    >
      <div class="sider-header">
        <div class="logo">
          <RobotOutlined class="logo-icon" />
          <span v-if="!collapsed" class="logo-text">AI Chatbot</span>
        </div>
        <a-tooltip v-if="!collapsed" title="新建会话">
          <a-button
            type="primary"
            shape="circle"
            :icon="h(PlusOutlined)"
            @click="handleNewConversation"
          />
        </a-tooltip>
      </div>

      <a-divider class="sider-divider" />

      <a-menu
        v-if="!collapsed"
        mode="inline"
        :selected-keys="[selectedKey]"
        :items="menuItems"
        @click="onMenuClick"
      />
      <div v-else class="sider-collapsed-tip">
        <UserOutlined />
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <a-button
          type="text"
          :icon="collapsed ? h(MessageOutlined) : h(MessageOutlined)"
          @click="collapsed = !collapsed"
        />
        <span class="header-title">AI 智能助手</span>
        <span class="header-sub">你好，欢迎使用</span>
      </a-layout-header>

      <a-layout-content class="app-content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.sider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-h, #08060d);
  font-weight: 600;
}

.logo-icon {
  font-size: 22px;
  color: #1677ff;
}

.logo-text {
  font-size: 16px;
  white-space: nowrap;
}

.sider-divider {
  margin: 0 16px 8px;
}

.sider-collapsed-tip {
  text-align: center;
  color: #999;
  padding: 16px 0;
  font-size: 18px;
}

.app-header {
  background: #fff !important;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border, #e5e4e7);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h, #08060d);
}

.header-sub {
  font-size: 13px;
  color: #999;
  margin-left: auto;
}

.app-content {
  background: var(--bg, #fff);
  padding: 0;
}

.sider-menu {
  text-align: left;
}

.sider-menu :deep(.ant-menu-title-content) {
  text-align: left;
}

.sider-menu :deep(.ant-menu-item) {
  text-align: left;
}
</style>
