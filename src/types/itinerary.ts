export interface ItineraryDay {
  day: number
  date: string
  city: string
  activities: string[]
  hotel?: string
  transport?: string
  notes?: string
}

export interface Itinerary {
  id: string
  title: string
  country: string
  cities: string[]
  departureDate: string
  returnDate: string
  duration: number
  budget: number
  summary: string
  visaPurposeNote?: string
  days: ItineraryDay[]
  createdAt: string
}

