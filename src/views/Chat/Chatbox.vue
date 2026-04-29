<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { SendOutlined } from "@ant-design/icons-vue";
import { Button, Card, Input, message } from "ant-design-vue";
import { useChatStore } from "@/stores/chat";
import type { ChatMessageItem } from "@/types/chat";
import {
  exportMarkdownTableExcel,
  hasTravelPlanTable,
} from "@/utils/exportExcel";

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

const isPendingAssistantMessage = (messageItem: ChatMessageItem) =>
  messageItem.role === "assistant" &&
  chatStore.loading &&
  chatStore.activeSessionId === messageItem.sessionId &&
  !messageItem.content;

const isAssistantMessageStreaming = (messageItem: ChatMessageItem) =>
  messageItem.role === "assistant" &&
  chatStore.loading &&
  chatStore.activeSessionId === messageItem.sessionId &&
  chatStore.messages.at(-1)?.id === messageItem.id;

const canExportAssistantTable = (messageItem: ChatMessageItem) =>
  messageItem.role === "assistant" &&
  hasTravelPlanTable(messageItem.content);

const hasReasoningContent = (messageItem: ChatMessageItem) =>
  messageItem.role === "assistant" &&
  !!messageItem.reasoningContent?.trim();

const getExportFileName = (messageItem: ChatMessageItem) => {
  const sessionTitle = chatStore.historyItems.find(
    (item) => item.sessionId === messageItem.sessionId,
  )?.title;

  return sessionTitle
    ? `${sessionTitle}-travel-plan.xlsx`
    : `travel-plan-${messageItem.sessionId.slice(0, 8)}.xlsx`;
};

const handleExportAssistantTable = async (messageItem: ChatMessageItem) => {
  try {
    await exportMarkdownTableExcel(
      messageItem.content,
      getExportFileName(messageItem),
    );
    message.success("Excel 已导出");
  } catch (err) {
    console.log(err);
    message.error("未识别到可导出的行程表格");
  }
};
</script>

<template>
  <Card class="card chatgpt__card" :bordered="false">
    <div class="chatgpt__messages" ref="chatMessage">
      <div
        v-if="
          chatStore.historyContentLoading && chatStore.messages.length === 0
        "
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
            v-if="hasReasoningContent(messageItem)"
            class="msg__reasoning"
          >
            <div class="msg__reasoningLabel">思考中</div>
            <div class="msg__reasoningText">
              {{ messageItem.reasoningContent }}
            </div>
          </div>

          <div
            v-if="isPendingAssistantMessage(messageItem)"
            class="msg__loading"
          >
            <div class="msg__loadingDots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div
            v-if="messageItem.html || messageItem.content"
            class="msg__content"
            v-html="messageItem.html ?? messageItem.content"
          />
          <div
            v-if="canExportAssistantTable(messageItem)"
            class="msg__actions"
          >
            <Button
              class="msg__exportBtn"
              size="small"
              type="default"
              :disabled="isAssistantMessageStreaming(messageItem)"
              @click="handleExportAssistantTable(messageItem)"
            >
              {{
                isAssistantMessageStreaming(messageItem)
                  ? "输出完成后可导出"
                  : "导出 Excel"
              }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="chatgpt__composer">
      <div class="chatgpt__quickStart">
        <div class="chatgpt__quickStartTitle">快速开始</div>
        <div class="chatgpt__quickStartHint">
          需要导出 Excel 时，建议让 AI 以 Markdown 表格返回行程。
        </div>
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.chatgpt__header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.96);
}
.chatgpt__card {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
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
  height: 62vh;
  overflow: auto;
  background: var(--surface-soft);
  border-radius: 0;
}

.chatgpt__title {
  font-weight: 900;
  color: #0f172a;
  font-size: 17px;
  letter-spacing: 0.2px;
}

.empty-state {
  padding: 22px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px dashed var(--line-strong);
}

.empty-state__title {
  font-weight: 900;
  color: var(--text-strong);
}

.empty-state__desc {
  margin-top: 6px;
  color: var(--text);
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.msg--user {
  align-self: flex-end;
  max-width: 80%;
}

.msg--ai {
  align-self: flex-start;
  max-width: min(92%, 980px);
}

.msg__meta {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  color: var(--text-muted);
  padding-inline: 6px;
}

.msg--user .msg__meta {
  text-align: right;
}

.msg__bubble {
  padding: 14px 16px 12px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: #ffffff;
  box-shadow: none;
  min-width: 0;
}

.msg--user .msg__bubble {
  background: var(--brand);
  border-color: var(--brand);
  border-top-right-radius: 10px;
}

.msg--ai .msg__bubble {
  background: #ffffff;
  border-color: var(--line);
  border-top-left-radius: 10px;
}

.msg--user .msg__content {
  color: #ffffff;
}

.msg--ai .msg__content {
  color: var(--text-strong);
}

.msg__content {
  line-height: 1.72;
  word-break: break-word;
  font-size: 14px;
  min-width: 0;
}

.msg__reasoning {
  margin-bottom: 10px;
  padding: 0 0 10px;
  border-bottom: 1px solid var(--line);
  background: transparent;
}

.msg__loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  color: var(--text-muted);
  font-size: 13px;
}

.msg__loadingDots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.msg__loadingDots span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brand);
  animation: loading-bounce 1.15s infinite ease-in-out;
}

.msg__loadingDots span:nth-child(2) {
  animation-delay: 0.15s;
}

.msg__loadingDots span:nth-child(3) {
  animation-delay: 0.3s;
}

.msg__loadingText {
  color: rgba(100, 116, 139, 0.92);
}

.msg__reasoningLabel {
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}

.msg__reasoningText {
  max-height: 120px;
  overflow-y: auto;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg__actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

:deep(.msg__exportBtn) {
  height: 30px;
  padding-inline: 14px;
  border-radius: 999px;
  border: 1px solid rgba(18, 185, 129, 0.2);
  background: var(--mint-soft);
  color: #067647;
  font-weight: 700;
  box-shadow: none;
}

:deep(.msg__exportBtn:hover) {
  border-color: rgba(18, 185, 129, 0.32);
  background: #ddfbea;
  color: #05603a;
}

:deep(.msg__exportBtn.ant-btn-default:not(:disabled):not(.ant-btn-disabled)) {
  border-color: rgba(22, 163, 74, 0.24);
  color: #166534;
}

:deep(.msg__exportBtn.ant-btn-default:not(:disabled):not(.ant-btn-disabled):hover) {
  border-color: rgba(21, 128, 61, 0.38);
  color: #14532d;
}

:deep(.msg__exportBtn:disabled),
:deep(.msg__exportBtn.ant-btn-default:disabled),
:deep(.msg__exportBtn.ant-btn-default.ant-btn-disabled) {
  border-color: rgba(148, 163, 184, 0.28);
  background: var(--surface-muted);
  color: var(--text-muted);
  box-shadow: none;
}

@keyframes loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.42;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
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
  background: var(--surface-muted);
}

.msg--user :deep(code) {
  background: rgba(255, 255, 255, 0.18);
}

.msg--ai :deep(pre) {
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-soft);
  overflow-x: auto;
}

.msg--user :deep(pre) {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  overflow-x: auto;
}

.msg__content :deep(.markdown-table-wrap) {
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: none;
  -webkit-overflow-scrolling: touch;
}

.msg__content :deep(.markdown-table-wrap:first-child) {
  margin-top: 0;
}

.msg__content :deep(.markdown-table-wrap:last-child) {
  margin-bottom: 0;
}

.msg__content :deep(.markdown-table) {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: auto;
  font-size: 13px;
}

.msg__content :deep(.markdown-table th),
.msg__content :deep(.markdown-table td) {
  min-width: 0;
  padding: 10px 12px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
}

.msg__content :deep(.markdown-table th) {
  background: var(--surface-soft);
  color: var(--text-strong);
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.msg__content :deep(.markdown-table th:nth-child(1)),
.msg__content :deep(.markdown-table td:nth-child(1)) {
  width: 110px;
  min-width: 110px;
}

.msg__content :deep(.markdown-table th:nth-child(2)),
.msg__content :deep(.markdown-table td:nth-child(2)) {
  width: 88px;
  min-width: 88px;
}

.msg__content :deep(.markdown-table th:nth-child(3)),
.msg__content :deep(.markdown-table td:nth-child(3)) {
  width: 100px;
  min-width: 100px;
}

.msg__content :deep(.markdown-table th:nth-child(4)),
.msg__content :deep(.markdown-table td:nth-child(4)) {
  width: 340px;
  min-width: 340px;
}

.msg__content :deep(.markdown-table th:nth-child(5)),
.msg__content :deep(.markdown-table td:nth-child(5)) {
  width: 88px;
  min-width: 88px;
}

.msg__content :deep(.markdown-table th:nth-child(6)),
.msg__content :deep(.markdown-table td:nth-child(6)) {
  width: 150px;
  min-width: 150px;
}

.msg__content :deep(.markdown-table th:nth-child(7)),
.msg__content :deep(.markdown-table td:nth-child(7)) {
  width: 170px;
  min-width: 170px;
}

.msg__content :deep(.markdown-table tbody tr:nth-child(even)) {
  background: var(--surface-soft);
}

.msg__content :deep(.markdown-table tr:last-child td) {
  border-bottom: 0;
}

.msg__content :deep(.markdown-table th:last-child),
.msg__content :deep(.markdown-table td:last-child) {
  border-right: 0;
}

.chatgpt__composer {
  padding: 12px 14px 14px;
  border-top: 1px solid var(--line);
  background: #ffffff;
}

.chatgpt__quickStart {
  margin-bottom: 10px;
}

.chatgpt__quickStartTitle {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-strong);
}

.chatgpt__quickStartHint {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.chatgpt__quickStartList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chatgpt__quickPrompt {
  appearance: none;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text);
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
  background: var(--brand-soft);
  border-color: rgba(37, 99, 235, 0.24);
  color: var(--brand);
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
  border-radius: 20px;
  background: #ffffff;
  border-color: var(--line);
  box-shadow: none;
}

.chatgpt__input:focus {
  outline: none;
}

.chatgpt__input:hover {
  border-color: var(--line-strong);
}

.chatgpt__input:focus {
  border-color: rgba(37, 99, 235, 0.5);
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
  background: var(--brand) !important;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
}

.btn_disable {
  background: #cbd5e1 !important;
  box-shadow: none;
}

.btn__icon {
  color: #fff;
}

@media (max-width: 640px) {
  .chatgpt__card {
    border-radius: 20px;
  }

  .chatgpt__messages {
    height: min(52dvh, 520px);
    min-height: 320px;
    padding: 12px;
    gap: 12px;
  }

  .empty-state {
    padding: 18px;
    border-radius: 18px;
  }

  .msg--user {
    max-width: 92%;
  }

  .msg--ai {
    max-width: 100%;
  }

  .msg__bubble {
    padding: 12px 13px;
    border-radius: 18px;
  }

  .msg__content {
    font-size: 13px;
    line-height: 1.7;
  }

  .chatgpt__composer {
    padding: 10px 12px 12px;
  }

  .chatgpt__quickStartHint {
    display: none;
  }

  .chatgpt__quickStartList {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .chatgpt__quickPrompt {
    flex: 0 0 auto;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chatgpt__input :deep(textarea) {
    min-height: 48px !important;
    padding: 10px 50px 10px 13px;
    border-radius: 18px;
  }

  .msg__content :deep(.markdown-table th:nth-child(4)),
  .msg__content :deep(.markdown-table td:nth-child(4)) {
    width: 240px;
    min-width: 240px;
  }
}
</style>
