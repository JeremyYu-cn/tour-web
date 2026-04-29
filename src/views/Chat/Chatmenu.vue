<script setup lang="ts">
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons-vue";
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
        <template #icon>
          <PlusOutlined />
        </template>
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
  top: 96px;
  height: calc(100vh - 122px);
  overflow: auto;
  border-radius: var(--radius-lg);
}

.sidebar__card {
  border-radius: var(--radius-lg);
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-soft);
}

.sidebar__title {
  font-size: 16px;
  font-weight: 900;
  color: var(--text-strong);
}

.sidebar__subtitle {
  margin-top: 4px;
  padding: 8px 0 0;
  color: var(--text);
  font-size: 13px;
  line-height: 1.6;
}

.sidebar__newBtn {
  margin-top: 14px;
  height: 42px;
  border-radius: 16px;
  font-weight: 800;
}

.sidebar__divider {
  margin: 14px 0;
}

.sidebar__sectionTitle {
  font-weight: 850;
  color: var(--text-strong);
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
  padding: 10px;
  border-radius: 16px;
  background: var(--surface-soft);
  border: 1px solid transparent;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.sidebar__historyItem:hover {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  background: #ffffff;
}

.sidebar__historyItem.is-active {
  border-color: rgba(37, 99, 235, 0.18);
  background: var(--brand-soft);
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
  color: var(--text-strong);
  line-height: 1.45;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sidebar__historyMeta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  word-break: break-all;
}

.sidebar__deleteBtn {
  flex: none;
  margin-top: 2px;
  min-width: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 12px;
}

.sidebar__empty {
  padding: 6px 0;
}

@media (max-width: 640px) {
  .chatgpt__sidebar {
    position: static;
    height: auto;
    border-radius: 20px;
  }

  .sidebar__card {
    padding: 14px;
    border-radius: 20px;
  }

  .sidebar__newBtn {
    height: 40px;
  }

  .sidebar__divider {
    margin: 12px 0;
  }

  .sidebar__historyList {
    max-height: 178px;
    overflow-y: auto;
    padding-right: 2px;
  }

  .sidebar__historyItem {
    padding: 9px;
    border-radius: 14px;
  }

  .sidebar__historyMeta {
    display: none;
  }
}
</style>
