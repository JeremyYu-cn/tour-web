import type { common_reponse_t } from "@/types/request";
import type { RecommendChatHistoryFile } from "@/types/recommend";
import request from "@/utils/request";

export function getRecommendList(
  pageIndex: number = 1,
  pageCount: number = 20,
) {
  return request.get<common_reponse_t<RecommendChatHistoryFile[]>>(
    `/tour/get_recommend?page=${pageIndex}&pageCount=${pageCount}`,
  );
}
