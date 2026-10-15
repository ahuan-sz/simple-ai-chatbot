<script setup>
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons-vue'

defineProps(['kind', 'cardData'])
const emit = defineEmits(['cardConfirm'])

/** 发送点单消息给 LLM */
function dianTa(id) {
  emit('cardConfirm', `我要点id为${id}的煲仔饭`)
}
</script>

<template>
  <a-card class="wm-card" :bordered="false">
    <template #title>
      <div class="wm-card-header">
        <ShoppingCartOutlined class="wm-card-header__icon" />
        <span>外卖卡片</span>
      </div>
    </template>

    <div class="wm-card-desc">
      你点的是：
      <a-tag color="orange" class="wm-card-desc__tag">{{ kind }}</a-tag>
    </div>

    <div class="wm-card-grid">
      <div
        v-for="item in cardData"
        :key="item.id"
        class="wm-card-item"
      >
        <div class="wm-card-item__avatar">
          <a-avatar :style="{ backgroundColor: '#faad14' }">
            <ShoppingOutlined />
          </a-avatar>
        </div>
        <div class="wm-card-item__info">
          <div class="wm-card-item__name">{{ item.name }}</div>
          <div class="wm-card-item__price">
            <MoneyCollectOutlined /> {{ item.price }} 元
          </div>
        </div>
        <a-button
          type="primary"
          size="small"
          class="wm-card-item__btn"
          @click="dianTa(item.id)"
        >
          点它
        </a-button>
      </div>
    </div>
  </a-card>
</template>

<style scoped>
.wm-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.wm-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.wm-card-header__icon {
  color: #faad14;
}

.wm-card-desc {
  font-size: 14px;
  margin-bottom: 12px;
}

.wm-card-desc__tag {
  margin-left: 4px;
}

.wm-card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.wm-card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  min-width: 200px;
  transition: box-shadow 0.2s;
}

.wm-card-item:hover {
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.2);
}

.wm-card-item__info {
  flex: 1;
  min-width: 0;
}

.wm-card-item__name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wm-card-item__price {
  color: #fa541c;
  font-size: 14px;
  font-weight: 500;
}

.wm-card-item__btn {
  flex-shrink: 0;
}
</style>
