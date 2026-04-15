import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Itinerary } from '../types/itinerary'

export const useItineraryStore = defineStore('itinerary', () => {
  const itineraries = ref<Itinerary[]>([])
  const keyword = ref('')

  const saveItinerary = (item: Itinerary) => {
    itineraries.value.unshift(item)
  }

  const removeItinerary = (id: string) => {
    itineraries.value = itineraries.value.filter((item) => item.id !== id)
  }

  const getById = (id: string) => itineraries.value.find((item) => item.id === id)

  const filteredList = computed(() => {
    const key = keyword.value.trim().toLowerCase()
    if (!key) return itineraries.value
    return itineraries.value.filter(
      (item) =>
        item.title.toLowerCase().includes(key) ||
        item.country.toLowerCase().includes(key) ||
        item.cities.join(',').toLowerCase().includes(key),
    )
  })

  return {
    itineraries,
    keyword,
    filteredList,
    saveItinerary,
    removeItinerary,
    getById,
  }
})

