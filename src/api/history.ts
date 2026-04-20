import type { common_reponse_t } from "@/types/request";
import request from "@/utils/request";

export type history_content_t = {
  userId: string;
  sessionId: string;
  content: string;
  createTime: string;
  role: "assistant" | "user";
};

export async function getHistoryListAPI() {
  const res = await request.get<common_reponse_t<string[]>>("/chat/history");

  return res.data;
}

export async function getHistoryContentAPI(session_id: string) {
  const res = await request.get<common_reponse_t<history_content_t[]>>(
    `/chat/history/${session_id}`,
  );

  return res.data;
}
