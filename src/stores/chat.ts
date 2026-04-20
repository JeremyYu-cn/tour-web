import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  ChatHistoryItem,
  ChatMessageItem,
  SessionTitleMap,
} from "../types/chat";
import type { Itinerary } from "../types/itinerary";
import { SSE } from "@/utils/sse";
import type { deepseek_chat_chunk_t } from "@/views/Chat/handler";
import { renderMarkdown, secheduleRender } from "@/utils/markdown";
import { getLocalstorage, setLocalstorage } from "@/localStorage";
import { getHistoryContentAPI, getHistoryListAPI } from "@/api/history";
import { getSessionIdAPI } from "@/api/ai";

const FALLBACK_TITLE_PREFIX = "新对话";

const normalizeTitle = (title: string) =>
  title.replace(/\s+/g, " ").trim().slice(0, 60);

const getFallbackTitle = (sessionId: string) =>
  `${FALLBACK_TITLE_PREFIX} ${sessionId.slice(0, 8)}`;

export const useChatStore = defineStore("chat", () => {
  const storedSessionTitleMap =
    getLocalstorage<SessionTitleMap>("sessionTitleMap");
  const messages = ref<ChatMessageItem[]>([]);
  const loading = ref(false);
  const historyLoading = ref(false);
  const historyContentLoading = ref(false);
  const activeSessionId = ref("");
  const historySessionIds = ref<string[]>([]);
  const sessionTitleMap = ref<SessionTitleMap>(
    storedSessionTitleMap && typeof storedSessionTitleMap === "object"
      ? storedSessionTitleMap
      : {},
  );
  const lastStructuredItinerary = ref<Omit<
    Itinerary,
    "id" | "createdAt"
  > | null>(null);
  const sse = new SSE({
    url: "http://localhost:6780/api/v1/tour/chat",
  });

  const persistSessionTitleMap = () => {
    setLocalstorage("sessionTitleMap", sessionTitleMap.value);
  };

  const upsertSessionTitle = (sessionId: string, title: string) => {
    const normalizedTitle = normalizeTitle(title);
    if (!sessionId || !normalizedTitle || sessionTitleMap.value[sessionId]) {
      return;
    }

    sessionTitleMap.value = {
      ...sessionTitleMap.value,
      [sessionId]: normalizedTitle,
    };
    persistSessionTitleMap();
  };

  const historyItems = computed<ChatHistoryItem[]>(() =>
    historySessionIds.value.map((sessionId) => ({
      sessionId,
      title: sessionTitleMap.value[sessionId] ?? getFallbackTitle(sessionId),
    })),
  );

  const hasHistorySession = (sessionId: string) =>
    historySessionIds.value.includes(sessionId);

  const resetCurrentSession = (sessionId = "") => {
    activeSessionId.value = sessionId;
    messages.value = [];
  };

  const ensureActiveSession = (sessionId: string) => {
    if (!sessionId) {
      resetCurrentSession();
      return;
    }

    if (activeSessionId.value !== sessionId) {
      resetCurrentSession(sessionId);
      return;
    }

    if (messages.value.length === 0) {
      activeSessionId.value = sessionId;
    }
  };

  const fetchHistoryList = async () => {
    historyLoading.value = true;

    try {
      const res = await getHistoryListAPI();
      if (!res.ok) {
        return false;
      }

      historySessionIds.value = res.data;
      return true;
    } catch (err) {
      console.log(err);
      return false;
    } finally {
      historyLoading.value = false;
    }
  };

  const loadHistoryContent = async (sessionId: string) => {
    if (!sessionId) {
      resetCurrentSession();
      return false;
    }

    if (!hasHistorySession(sessionId)) {
      ensureActiveSession(sessionId);
      return true;
    }

    if (activeSessionId.value === sessionId && messages.value.length > 0) {
      return true;
    }

    historyContentLoading.value = true;
    activeSessionId.value = sessionId;
    messages.value = [];

    try {
      const res = await getHistoryContentAPI(sessionId);
      if (!res.ok) {
        ensureActiveSession(sessionId);
        return false;
      }

      const nextMessages = await Promise.all(
        res.data.map(async (item) => {
          const nextMessage: ChatMessageItem = {
            id: crypto.randomUUID(),
            sessionId: item.sessionId,
            role: item.role,
            content: item.content,
            createdAt: item.createTime,
          };

          if (item.role === "assistant" && item.content.trim()) {
            nextMessage.html = await renderMarkdown(item.content);
          }

          return nextMessage;
        }),
      );

      if (
        activeSessionId.value !== sessionId ||
        messages.value.some((item) => item.sessionId === sessionId)
      ) {
        return true;
      }

      messages.value = nextMessages;

      const firstUserMessage = res.data.find(
        (item) => item.role === "user" && item.content.trim(),
      );
      if (firstUserMessage) {
        upsertSessionTitle(sessionId, firstUserMessage.content);
      }

      return true;
    } catch (err) {
      console.log(err);
      ensureActiveSession(sessionId);
      return false;
    } finally {
      historyContentLoading.value = false;
    }
  };

  const createSession = async () => {
    const res = await getSessionIdAPI();
    if (!res.ok) {
      return null;
    }

    resetCurrentSession(res.data.sessionID);
    return res.data.sessionID;
  };

  const sendMessage = async (
    content: string,
    sessionId: string,
    onMessage?: () => void,
  ) => {
    let markdownRender:
      | ((content: string, cb: (res: string) => void) => void)
      | null = secheduleRender();

    activeSessionId.value = sessionId;
    upsertSessionTitle(sessionId, content);

    messages.value.push({
      id: crypto.randomUUID(),
      sessionId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });

    const assistantMessageId = crypto.randomUUID();

    messages.value.push({
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    });
    onMessage?.();

    const assistantMessageIndex = messages.value.findIndex(
      (item) => item.id === assistantMessageId,
    );

    loading.value = true;

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const finish = (callback: () => void) => {
          if (settled) {
            return;
          }

          settled = true;
          loading.value = false;
          markdownRender = null;
          callback();
        };

        const cancel = sse.create(
          { msg: content, session_id: sessionId },
          {
            onmessage: (ev) => {
              if (ev.data === "[DONE]") {
                finish(resolve);
                return;
              }

              try {
                const res: deepseek_chat_chunk_t = JSON.parse(ev.data);
                const chunk = res.choices[0].delta.content;

                if (chunk) {
                  const assistantMessage =
                    messages.value[assistantMessageIndex];
                  if (!assistantMessage) {
                    return;
                  }

                  assistantMessage.content += chunk;
                  markdownRender?.(assistantMessage.content, (html) => {
                    assistantMessage.html = html;
                    onMessage?.();
                  });
                }
              } catch (err) {
                console.log(err);
              }
            },
            onerror: (err) => {
              cancel();
              finish(() => reject(err));
            },
            onclose: () => {
              finish(resolve);
            },
          },
        );
      });
    } finally {
      await fetchHistoryList();
    }
  };

  return {
    messages,
    loading,
    historyLoading,
    historyContentLoading,
    activeSessionId,
    historyItems,
    lastStructuredItinerary,
    hasHistorySession,
    ensureActiveSession,
    resetCurrentSession,
    fetchHistoryList,
    loadHistoryContent,
    createSession,
    sendMessage,
  };
});
