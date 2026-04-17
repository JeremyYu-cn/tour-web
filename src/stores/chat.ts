import { defineStore } from "pinia";
import { ref } from "vue";
import type { ChatMessageItem } from "../types/chat";
import type { Itinerary } from "../types/itinerary";
import { SSE } from "@/utils/sse";
import type { deepseek_chat_chunk_t } from "@/views/Chat/handler";
import { secheduleRender } from "@/utils/markdown";
import { getLocalstorage } from "@/localStorage";
import { type auth_response_t } from "@/api/auth";

export const useChatStore = defineStore("chat", () => {
  const messages = ref<ChatMessageItem[]>([]);
  const loading = ref(false);
  const lastStructuredItinerary = ref<Omit<
    Itinerary,
    "id" | "createdAt"
  > | null>(null);
  const sse = new SSE({
    url: "http://localhost:6780/api/v1/deepseek/chat",
  });

  const sendMessage = async (
    content: string,
    sessionID: string,
    onMessage?: () => void,
  ) => {
    let markdownRender:
      | ((content: string, cb: (res: string) => void) => void)
      | null = secheduleRender();
    messages.value.push({
      id: crypto.randomUUID(),
      role: "user",
      content: content,
      createdAt: new Date().toISOString(),
    });

    const uuid = crypto.randomUUID();

    messages.value.push({
      id: uuid,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    });

    const index = messages.value.findIndex((val) => val.id == uuid);

    loading.value = true;
    const cancel = await sse.create(
      { msg: content, session_id: sessionID },
      {
        onmessage: (ev) => {
          if (ev.data === "[DONE]") {
            loading.value = false;
            markdownRender = null;
          } else {
            try {
              let res: deepseek_chat_chunk_t = JSON.parse(ev.data);
              if (res.choices[0].delta.content) {
                messages.value[index].content += res.choices[0].delta.content;
                markdownRender?.(messages.value[index].content, (res) => {
                  messages.value[index].html = res;
                  onMessage?.();
                });
              }
            } catch (err) {
              console.log(err);
            }
          }
        },
        onerror: () => {
          cancel();
        },
      },
    );
  };

  return {
    messages,
    loading,
    lastStructuredItinerary,
    sendMessage,
  };
});
