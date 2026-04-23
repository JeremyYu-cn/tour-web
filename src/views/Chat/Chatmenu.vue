<script setup lang="ts">
import { DeleteOutlined } from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { Button, Divider, Empty, Modal, message } from "ant-design-vue";
import { useChatStore } from "@/stores/chat";

const router = useRouter();
const chatStore = useChatStore();

const isHistoryBusy = () =>
  chatStore.loading ||
  chatStore.historyContentLoading ||
  !!chatStore.historyDeletingSessionId;

const handleHistorySelect = (sessionId: string) => {
  if (isHistoryBusy() || chatStore.activeSessionId === sessionId) {
    return;
  }

  void router.push({
    name: "chat",
    params: {
      sessionId,
    },
  });
};

const handleCreateConversation = async () => {
  if (isHistoryBusy()) {
    return;
  }

  chatStore.resetCurrentSession();
  await router.push("/chat");
};

const handleDeleteHistory = (sessionId: string) => {
  if (!sessionId || isHistoryBusy()) {
    return;
  }

  Modal.confirm({
    title: "提示",
    content: "确定要删除这条历史记录吗？",
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: async () => {
      const isActiveSession = chatStore.activeSessionId === sessionId;
      const res = await chatStore.deleteHistory(sessionId);

      if (!res.ok) {
        message.error(res.msg || "删除失败");
        return Promise.reject();
      }

      if (isActiveSession) {
        await router.replace("/chat");
      }

      message.success("已删除");
      return true;
    },
  });
};
</script>

<template>
  <div class="chatgpt__sidebar">
    <div class="sidebar__card">
      <div class="sidebar__title">Easy Tour AI</div>
      <div class="sidebar__subtitle">生成“签证友好”的结构化行程</div>

      <Button
        block
        type="primary"
        class="sidebar__newBtn"
        :disabled="chatStore.loading || chatStore.historyContentLoading"
        @click="handleCreateConversation"
      >
        新建对话
      </Button>

      <Divider class="sidebar__divider" />

      <div class="sidebar__sectionTitle">History</div>
      <div v-if="chatStore.historyItems.length" class="sidebar__historyList">
        <div
          v-for="item in chatStore.historyItems"
          :key="item.sessionId"
          :class="[
            'sidebar__historyItem',
            chatStore.activeSessionId === item.sessionId && 'is-active',
          ]"
        >
          <button
            class="sidebar__historyMain"
            type="button"
            :disabled="isHistoryBusy()"
            @click="handleHistorySelect(item.sessionId)"
          >
            <div class="sidebar__historyText">{{ item.title }}</div>
            <div class="sidebar__historyMeta">
              {{ item.sessionId }}
            </div>
          </button>
          <Button
            danger
            type="text"
            class="sidebar__deleteBtn"
            :loading="chatStore.historyDeletingSessionId === item.sessionId"
            :disabled="isHistoryBusy()"
            :title="`删除 ${item.title}`"
            @click="handleDeleteHistory(item.sessionId)"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
          </Button>
        </div>
      </div>
      <Empty
        v-else
        class="sidebar__empty"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        :description="
          chatStore.historyLoading ? '历史记录加载中' : '还没有历史记录'
        "
      />
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
  padding: 10px 0 0;
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}

.sidebar__newBtn {
  margin-top: 12px;
  height: 40px;
  border-radius: 12px;
  font-weight: 800;
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
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
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

.sidebar__historyItem.is-active {
  border-color: rgba(24, 144, 255, 0.52);
  background: rgba(230, 244, 255, 0.92);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.1);
}

.sidebar__historyMain {
  flex: 1;
  min-width: 0;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.sidebar__historyMain:disabled {
  cursor: not-allowed;
}

.sidebar__historyText {
  color: rgba(15, 23, 42, 0.86);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sidebar__historyMeta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.46);
  word-break: break-all;
}

.sidebar__deleteBtn {
  flex: none;
  margin-top: 2px;
  min-width: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
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
