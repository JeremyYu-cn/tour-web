<script setup lang="ts">
import { Divider, Space, Tag } from "ant-design-vue";
const quickPrompts = [
  "我要申请日本旅游签证，计划 7 天游览东京+大阪，预算 8000 元",
  "帮我生成法国 10 日签证用行程，包含酒店与交通建议",
  "生成 5 天游玩新加坡的签证行程单，偏好美食和城市景点",
];

const props = defineProps<{
  selectedPrompt: string;
  selectedPromptVersion: number;
}>();

const emit = defineEmits<{
  (e: "update:selectedPrompt", prompt: string): void;
  (e: "update:selectedPromptVersion", version: number): void;
}>();

const handlePromptSelect = (prompt: string) => {
  emit("update:selectedPrompt", prompt);
  emit("update:selectedPromptVersion", props.selectedPromptVersion + 1);
};
</script>

<template>
  <div class="chatgpt__sidebar">
    <div class="sidebar__card">
      <div class="sidebar__title">Easy Tour AI</div>
      <div class="sidebar__subtitle">生成“签证友好”的结构化行程</div>
      <Space wrap class="sidebar__tags">
        <Tag color="blue">行程</Tag>
        <Tag color="purple">住宿</Tag>
        <Tag color="green">交通</Tag>
        <Tag color="gold">预算</Tag>
      </Space>

      <Divider class="sidebar__divider" />
      <div class="sidebar__sectionTitle">快速开始</div>
      <Space direction="vertical" class="sidebar__promptList" :size="8">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          class="sidebar__prompt"
          type="button"
          @click="handlePromptSelect(prompt)"
        >
          {{ prompt }}
        </button>
      </Space>

      <Divider class="sidebar__divider" />
    </div>
  </div>
</template>

<style scoped>
.sidebar__subtitle {
  padding: 10px 0;
}
</style>
