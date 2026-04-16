export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
  content: string;
  html?: string;
}
