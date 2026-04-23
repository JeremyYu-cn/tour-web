export interface RecommendChatHistory {
  summary: string;
  data: string;
  createTime: string;
  cities?: string[];
  coverCity?: string;
  coverImageUrl?: string;
  imageUrl?: string;
  imageProvider?: string;
  imageAttribution?: string;
  imagePageUrl?: string;
  imagePhotographer?: string;
  imagePhotographerUrl?: string;
  coverImage?: string;
  coverUrl?: string;
  cover?: string;
}

export interface RecommendChatHistoryFile extends RecommendChatHistory {
  id: string;
  fileName?: string;
}
