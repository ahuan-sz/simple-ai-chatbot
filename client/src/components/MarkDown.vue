<script setup>
import { VueMarkdown } from '@crazydos/vue-markdown';
import remarkGfm from 'remark-gfm';
import highlightPlugins from 'rehype-highlight';

const { content } = defineProps(["content"]);
</script>

<template>
  <VueMarkdown :custom-attrs="{
    a: { class: 'markdown-a' }
  }"
  :remark-plugins="[remarkGfm]"
  :rehype-plugins="[highlightPlugins]"
  :markdown="content"
  >
    <template #input="{ ...props }">
      <span v-if="props.type === 'checkbox' && props.checked">✅</span>
      <span v-if="props.type === 'checkbox' && !props.checked">[ ]</span>
    </template>
    <template #li="{ children }">
      <div class="my-li">
        <Component :is="children" />
      </div>
    </template>
  </VueMarkdown>
</template>

<style scoped>
.my-li {
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 0;
  padding-left: 0.2em;
}
.li-marker {
  flex-shrink: 0;
  user-select: none;
  min-width: 1.2em;
  text-align: center;
  color: #888;
}
.li-content {
  flex: 1;
  min-width: 0;
}
.li-content :deep(*) {
  margin: 0;
}
</style>

