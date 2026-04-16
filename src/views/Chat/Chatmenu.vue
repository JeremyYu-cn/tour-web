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
.chatgpt__sidebar {
  position: sticky;
  top: 84px;
  height: calc(100vh - 110px);
  overflow: auto;
  border-radius: 14px;
}

.sidebar__card {
  border-radius: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.06);
}

.sidebar__title {
  font-size: 16px;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.88);
}

.sidebar__subtitle {
  margin-top: 4px;
  padding: 10px 0;
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}

.sidebar__tags {
  margin-top: 10px;
}

.sidebar__divider {
  margin: 14px 0;
}

.sidebar__sectionTitle {
  font-weight: 850;
  color: rgba(0, 0, 0, 0.78);
  margin-bottom: 8px;
  font-size: 13px;
}

.sidebar__promptList {
  width: 100%;
}

.sidebar__prompt {
  text-align: left;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  color: rgba(0, 0, 0, 0.76);
  line-height: 1.45;
}

.sidebar__prompt:hover {
  border-color: rgba(24, 144, 255, 0.35);
  box-shadow: 0 10px 20px rgba(16, 24, 40, 0.08);
}

@media (max-width: 640px) {
  .chatgpt__sidebar {
    position: static;
    height: auto;
  }
}
</style>
