import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlightOffer } from '../types/flight'
import { queryFlightOffers } from '../api/flight'

export const useFlightStore = defineStore('flight', () => {
  const offers = ref<FlightOffer[]>([])
  const loading = ref(false)

  const searchFlights = async (params: {
    origin: string
    destination: string
    departDate: string
    returnDate?: string
  }) => {
    loading.value = true
    try {
      offers.value = (await queryFlightOffers(params)) as FlightOffer[]
    } finally {
      loading.value = false
    }
  }

  return {
    offers,
    loading,
    searchFlights,
  }
})

