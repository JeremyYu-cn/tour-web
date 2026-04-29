<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import BasicLayout from "@/layouts/BasicLayout.vue";
import { useChatStore } from "@/stores/chat";
import Chatbox from "./Chatbox.vue";
import Chatmenu from "./Chatmenu.vue";

const route = useRoute();
const chatStore = useChatStore();
const historyReady = ref(false);

const syncSessionByRoute = async (nextSessionId: unknown) => {
  if (!historyReady.value) {
    await chatStore.fetchHistoryList();
    historyReady.value = true;
  }

  const sessionId = typeof nextSessionId === "string" ? nextSessionId : "";

  if (!sessionId) {
    chatStore.resetCurrentSession();
    return;
  }

  if (!chatStore.hasHistorySession(sessionId)) {
    chatStore.ensureActiveSession(sessionId);
    return;
  }

  await chatStore.loadHistoryContent(sessionId);
};

watch(
  () => route.params.sessionId,
  (sessionId) => {
    void syncSessionByRoute(sessionId);
  },
  { immediate: true },
);
</script>

<template>
  <BasicLayout>
    <div class="chatgpt">
      <Chatmenu />
      <div class="chatgpt__main">
        <Chatbox />
      </div>
    </div>
  </BasicLayout>
</template>

<style scoped>
.chatgpt {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.chatgpt__main {
  min-width: 0;
}

@media (max-width: 640px) {
  .chatgpt {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
