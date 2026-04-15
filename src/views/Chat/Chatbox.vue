<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button, Card, Input, Space, message } from "ant-design-vue";
import { useChatStore } from "../../stores/chat";
import { useItineraryStore } from "../../stores/itinerary";
import type { Itinerary } from "../../types/itinerary";

const props = defineProps<{
  prefillText?: string;
  prefillVersion?: number;
}>();

const chatStore = useChatStore();
const itineraryStore = useItineraryStore();

const input = ref("");
const canSend = computed(
  () => input.value.trim().length > 0 && !chatStore.loading,
);

watch(
  () => [props.prefillText, props.prefillVersion] as const,
  ([nextText]) => {
    if (!nextText) return;
    input.value = nextText;
  },
  { immediate: true },
);

const handleSend = async () => {
  if (!input.value.trim()) return;

  try {
    const itinerary = await chatStore.sendMessage(input.value.trim());
    if (itinerary) {
      itineraryStore.saveItinerary({
        ...(itinerary as Omit<Itinerary, "id" | "createdAt">),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      message.success("AI 行程已生成并保存");
    } else {
      message.warning("AI 返回未包含结构化 itinerary（后端接入后即可保存）");
    }
  } catch (error) {
    message.error("生成失败，请稍后重试");
    // eslint-disable-next-line no-console
    console.error(error);
  } finally {
    input.value = "";
  }
};
</script>

<template>
  <Card class="card chatgpt__card" :bordered="false">
    <div class="chatgpt__header">
      <div class="chatgpt__title">AI 对话</div>
      <div class="chatgpt__hint">描述你的签证行程需求，越具体越好</div>
    </div>

    <div class="chatgpt__messages">
      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <div class="empty-state__title">从一句需求开始</div>
        <div class="empty-state__desc">
          例如：7 天日本签证行程（东京 + 大阪），预算 8000 元
        </div>
      </div>

      <div
        v-for="messageItem in chatStore.messages"
        :key="messageItem.id"
        class="msg"
        :class="messageItem.role === 'user' ? 'msg--user' : 'msg--ai'"
      >
        <div class="msg__bubble">
          <div class="msg__meta">
            {{ messageItem.role === "user" ? "你" : "Easy Tour AI" }}
          </div>
          <div class="msg__text">{{ messageItem.content }}</div>
        </div>
      </div>
    </div>

    <div class="chatgpt__composer">
      <Input.TextArea
        class="chatgpt__input"
        v-model:value="input"
        :auto-size="{ minRows: 2, maxRows: 6 }"
        placeholder="输入你的需求…（Enter 发送，Shift+Enter 换行）"
        @press-enter.exact.prevent="handleSend"
      />
      <div class="composer__actions">
        <Space :size="10">
          <Button
            @click="input = ''"
            :disabled="!input.trim() || chatStore.loading"
            >清空</Button
          >
          <Button
            type="primary"
            :loading="chatStore.loading"
            :disabled="!canSend"
            @click="handleSend"
          >
            发送
          </Button>
        </Space>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.chatgpt__header {
  padding: 16px 16px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.75);
}
.chatgpt__card {
  padding: 0;
  overflow: hidden;
}

.chatgpt__hint {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}
.chatgpt__messages {
  padding: 16px;
  height: 50vh;
  overflow: auto;
  background: rgba(255, 255, 255, 0.55);
}
.chatgpt__title {
  font-weight: 900;
  color: rgba(0, 0, 0, 0.88);
}
.chatgpt__main {
  min-width: 0;
}
.chatgpt__input {
  width: 100%;
  height: 100px !important ;
  resize: none;
}
.chatgpt__input:focus {
  outline: none;
}
.chatgpt__input:hover {
  border-color: rgba(24, 144, 255, 0.35);
}
.chatgpt__input:focus {
  border-color: rgba(24, 144, 255, 0.35);
}
</style>
