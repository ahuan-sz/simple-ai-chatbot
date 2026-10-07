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

/* 表格扁平化样式 */
:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 14px;
}
:deep(th) {
  background-color: #f5f7fa;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}
:deep(td) {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  color: #606266;
}
/* 斑马纹:奇偶行背景色交替,提升可读性 */
:deep(tbody tr:nth-child(odd)) {
  background-color: #ffffff;
}
:deep(tbody tr:nth-child(even)) {
  background-color: #fafbfc;
}
/* 悬停高亮,增强交互感 */
:deep(tbody tr:hover) {
  background-color: #ecf5ff;
}

/* 行内 code 样式:排除 pre 内的 code(代码块) */
:deep(:not(pre) > code:not([class*="language-"])) {
  background-color: #f3f4f6;
  color: #d6336c;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
  font-size: 0.9em;
}

/* 代码块容器 */
:deep(pre) {
  background-color: #282c34;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  position: relative;
}
:deep(pre code) {
  background-color: transparent;
  color: #abb2bf;
  padding: 0;
  border-radius: 0;
  font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>

