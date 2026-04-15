import axios from 'axios'

export async function queryFlightOffers(params: {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}) {
  const { data } = await axios.post('/api/mcp/flights/search', params)
  return (data as { offers: unknown[] }).offers
}

