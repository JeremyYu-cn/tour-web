import axios from 'axios'

export async function fetchItineraries() {
  const { data } = await axios.get('/api/itineraries')
  return data
}

export async function createItinerary(payload: unknown) {
  const { data } = await axios.post('/api/itineraries', payload)
  return data
}

