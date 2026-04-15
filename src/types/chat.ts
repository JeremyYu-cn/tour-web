export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

