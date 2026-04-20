<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { SendOutlined } from "@ant-design/icons-vue";
import { Button, Card, Input, message } from "ant-design-vue";
import { useChatStore } from "@/stores/chat";

const quickPrompts = [
  "我要申请日本旅游签证，计划 7 天游览东京+大阪，预算 8000 元",
  "帮我生成法国 10 日签证用行程，包含酒店与交通建议",
  "生成 5 天游玩新加坡的签证行程单，偏好美食和城市景点",
];

const router = useRouter();
const chatStore = useChatStore();
const chatMessage = ref<HTMLDivElement | null>(null);
const input = ref("");
const canSend = computed(
  () =>
    input.value.trim().length > 0 &&
    !chatStore.loading &&
    !chatStore.historyContentLoading,
);

const scrollToBottom = async () => {
  await nextTick();
  if (chatMessage.value) {
    chatMessage.value.scrollTop = chatMessage.value.scrollHeight;
  }
};

const handleSend = async () => {
  const content = input.value.trim();
  if (!content) return;

  let sessionId = chatStore.activeSessionId;

  if (!sessionId) {
    const createdSessionId = await chatStore.createSession();
    if (!createdSessionId) {
      message.error("创建会话失败");
      return;
    }

    sessionId = createdSessionId;

    await router.replace({
      name: "chat",
      params: {
        sessionId,
      },
    });
  }

  input.value = "";

  try {
    await chatStore.sendMessage(content, sessionId, () => {
      void scrollToBottom();
    });
    await scrollToBottom();
  } catch (err) {
    input.value = content;
    message.error("消息发送失败");
    console.log(err);
  }
};

const handlePromptSelect = (prompt: string) => {
  input.value = prompt;
};
</script>

<template>
  <Card class="card chatgpt__card" :bordered="false">
    <div class="chatgpt__messages" ref="chatMessage">
      <div
        v-if="chatStore.historyContentLoading && chatStore.messages.length === 0"
        class="empty-state"
      >
        <div class="empty-state__title">正在加载会话</div>
        <div class="empty-state__desc">历史消息加载完成后会显示在这里</div>
      </div>

      <div v-else-if="chatStore.messages.length === 0" class="empty-state">
        <div class="empty-state__title">描述你的行程</div>
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
        <div class="msg__meta">
          {{ messageItem.role === "user" ? "你" : "Easy Tour AI" }}
        </div>
        <div class="msg__bubble">
          <div
            class="msg__content"
            v-html="messageItem.html ?? messageItem.content"
          />
        </div>
      </div>
    </div>

    <div class="chatgpt__composer">
      <div class="chatgpt__quickStart">
        <div class="chatgpt__quickStartTitle">快速开始</div>
        <div class="chatgpt__quickStartList">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="chatgpt__quickPrompt"
            type="button"
            @click="handlePromptSelect(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <div class="chatgpt__inputWrap">
        <Input.TextArea
          class="chatgpt__input"
          v-model:value="input"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          placeholder="输入你的需求…（Enter 发送，Shift+Enter 换行）"
          :disabled="chatStore.historyContentLoading"
          @press-enter.exact.prevent="handleSend"
        />
        <Button
          class="chatgpt__sendBtn"
          type="primary"
          shape="circle"
          :loading="chatStore.loading"
          :disabled="!canSend"
          :class="!canSend ? 'btn_disable' : ''"
          @click="handleSend"
        >
          <template #icon>
            <SendOutlined class="btn__icon" />
          </template>
        </Button>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.card {
  border-radius: 22px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.chatgpt__header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.96);
}
.chatgpt__card {
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.05);
  background: #ffffff;
}

.chatgpt__hint {
  margin-top: 6px;
  color: rgba(71, 85, 105, 0.8);
  font-size: 13px;
}

.chatgpt__messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  height: 60vh;
  overflow: auto;
  background: linear-gradient(180deg, #f8fafc, #f6f8fb);
  border-radius: 5px;
}

.chatgpt__title {
  font-weight: 900;
  color: #0f172a;
  font-size: 17px;
  letter-spacing: 0.2px;
}

.empty-state {
  padding: 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.empty-state__title {
  font-weight: 900;
  color: rgba(0, 0, 0, 0.88);
}

.empty-state__desc {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.6);
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 80%;
}

.msg--user {
  align-self: flex-end;
}

.msg--ai {
  align-self: flex-start;
}

.msg__meta {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: rgba(100, 116, 139, 0.85);
  padding-inline: 6px;
}

.msg--user .msg__meta {
  text-align: right;
}

.msg__bubble {
  padding: 14px 16px 12px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.msg--user .msg__bubble {
  background: linear-gradient(135deg, #e6f4ff, #f4faff 60%, #ffffff);
  border-color: rgba(147, 197, 253, 0.78);
  border-top-right-radius: 8px;
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.1);
}

.msg--ai .msg__bubble {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.98)
  );
  border-color: rgba(226, 232, 240, 0.98);
  border-top-left-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.msg--user .msg__content {
  color: #0f3e66;
}

.msg--ai .msg__content {
  color: #1e293b;
}

.msg__content {
  line-height: 1.72;
  word-break: break-word;
  font-size: 14px;
}

.msg__content :deep(p:first-child) {
  margin-top: 0;
}

.msg__content :deep(p:last-child) {
  margin-bottom: 0;
}

.msg--user :deep(p),
.msg--user :deep(li),
.msg--user :deep(strong),
.msg--user :deep(code) {
  color: inherit;
}

.msg--ai :deep(code),
.msg--user :deep(code) {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.msg--ai :deep(code) {
  background: rgba(15, 23, 42, 0.06);
}

.msg--user :deep(code) {
  background: rgba(255, 255, 255, 0.72);
}

.msg--ai :deep(pre) {
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  overflow-x: auto;
}

.msg--user :deep(pre) {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
  overflow-x: auto;
}

.chatgpt__composer {
  padding: 10px 14px 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.98);
}

.chatgpt__quickStart {
  margin-bottom: 10px;
}

.chatgpt__quickStartTitle {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(71, 85, 105, 0.82);
}

.chatgpt__quickStartList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chatgpt__quickPrompt {
  appearance: none;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: #f8fafc;
  color: #334155;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  line-height: 1.35;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.chatgpt__quickPrompt:hover {
  background: #eef6ff;
  border-color: rgba(96, 165, 250, 0.8);
  transform: translateY(-1px);
}

.chatgpt__inputWrap {
  position: relative;
}

.chatgpt__input {
  width: 100%;
  height: 58px !important;
  resize: none;
}

.chatgpt__input :deep(textarea) {
  padding: 11px 52px 11px 14px;
  border-radius: 18px;
  background: #ffffff;
  border-color: rgba(203, 213, 225, 0.9);
  box-shadow: none;
}

.chatgpt__input:focus {
  outline: none;
}

.chatgpt__input:hover {
  border-color: rgba(148, 163, 184, 0.9);
}

.chatgpt__input:focus {
  border-color: rgba(59, 130, 246, 0.9);
}

.chatgpt__sendBtn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  border: 0;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}

.btn_disable {
  background: #a1a1a1 !important;
}

.btn__icon {
  color: #fff;
}

@media (max-width: 640px) {
  .chatgpt__messages {
    height: 54vh;
    padding: 14px;
  }

  .msg {
    max-width: 90%;
  }

  .chatgpt__composer {
    padding: 10px 12px 12px;
  }
}
</style>
