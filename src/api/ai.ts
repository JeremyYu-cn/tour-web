import axios from 'axios'

export async function generateItineraryByAI(prompt: string) {
  const { data } = await axios.post('/api/ai/plan', { prompt })
  return data as { text: string; itinerary?: unknown }
}

