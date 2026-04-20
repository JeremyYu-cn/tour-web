import type { common_reponse_t } from "@/types/request";
import request from "@/utils/request";

type get_session_response_t = {
  sessionID: string;
};

export async function getSessionIdAPI() {
  const res = await request.post<common_reponse_t<get_session_response_t>>(
    "/chat/session/create",
  );

  return res.data;
}
