<script setup>
const { kind, cardData } = defineProps(['kind', 'cardData'])
const emit = defineEmits(['cardConfirm'])
function dianTa(id) {
  emit('cardConfirm', `我要点id为${id}的煲仔饭`)
}
</script>

<template>
  <div>
    <div>我是一个外卖卡片，你点的是{{ kind }}</div>
    <div v-for="item in cardData" :key="item.id">
      {{ item.name }} - {{ item.price }}元
      <button @click="dianTa(item.id)">点它</button>
    </div>
  </div>
</template> 