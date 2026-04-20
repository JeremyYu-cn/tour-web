export interface ChatMessageItem {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  createdAt: string;
  content: string;
  html?: string;
}

export interface ChatHistoryItem {
  sessionId: string;
  title: string;
}

export type SessionTitleMap = Record<string, string>;
