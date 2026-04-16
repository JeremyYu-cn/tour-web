<script setup lang="ts">
import { computed } from "vue";
import { Divider, Empty } from "ant-design-vue";
import { useChatStore } from "@/stores/chat";

const chatStore = useChatStore();

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

const historyItems = computed(() =>
  chatStore.messages
    .filter((item) => item.role === "user" && item.content.trim())
    .slice()
    .reverse()
    .slice(0, 8),
);
</script>

<template>
  <div class="chatgpt__sidebar">
    <div class="sidebar__card">
      <div class="sidebar__title">Easy Tour AI</div>
      <div class="sidebar__subtitle">生成“签证友好”的结构化行程</div>

      <div class="sidebar__sectionTitle">History</div>
      <div v-if="historyItems.length" class="sidebar__historyList">
        <button
          v-for="item in historyItems"
          :key="item.id"
          class="sidebar__historyItem"
          type="button"
          @click="handlePromptSelect(item.content)"
        >
          <div class="sidebar__historyText">{{ item.content }}</div>
          <div class="sidebar__historyTime">
            {{ new Date(item.createdAt).toLocaleString() }}
          </div>
        </button>
      </div>
      <Empty
        v-else
        class="sidebar__empty"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        description="还没有历史记录"
      />

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

.sidebar__divider {
  margin: 14px 0;
}

.sidebar__sectionTitle {
  font-weight: 850;
  color: rgba(0, 0, 0, 0.78);
  margin-bottom: 8px;
  font-size: 13px;
}

.sidebar__historyList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__historyItem {
  text-align: left;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.sidebar__historyItem:hover {
  transform: translateY(-1px);
  border-color: rgba(24, 144, 255, 0.3);
  box-shadow: 0 10px 20px rgba(16, 24, 40, 0.08);
}

.sidebar__historyText {
  color: rgba(15, 23, 42, 0.86);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sidebar__historyTime {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.46);
}

.sidebar__empty {
  padding: 6px 0;
}

@media (max-width: 640px) {
  .chatgpt__sidebar {
    position: static;
    height: auto;
  }
}
</style>
