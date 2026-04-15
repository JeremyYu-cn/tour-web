import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessageItem } from '../types/chat'
import { generateItineraryByAI } from '../api/ai'
import type { Itinerary } from '../types/itinerary'

function coerceItinerary(value: unknown): Omit<Itinerary, 'id' | 'createdAt'> | null {
  if (!value || typeof value !== 'object') return null
  return value as Omit<Itinerary, 'id' | 'createdAt'>
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessageItem[]>([])
  const loading = ref(false)
  const lastStructuredItinerary = ref<Omit<Itinerary, 'id' | 'createdAt'> | null>(null)

  const sendMessage = async (content: string) => {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    })

    loading.value = true
    try {
      const res = await generateItineraryByAI(content)
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.text,
        createdAt: new Date().toISOString(),
      })
      lastStructuredItinerary.value = coerceItinerary(res.itinerary)
      return lastStructuredItinerary.value
    } finally {
      loading.value = false
    }
  }

  return {
    messages,
    loading,
    lastStructuredItinerary,
    sendMessage,
  }
})

