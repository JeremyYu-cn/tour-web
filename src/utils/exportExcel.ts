import * as XLSX from 'xlsx'
import type { Itinerary } from '../types/itinerary'

export function exportItineraryExcel(itinerary: Itinerary) {
  const rows = itinerary.days.map((day) => ({
    Day: `Day ${day.day}`,
    Date: day.date,
    City: day.city,
    Activities: day.activities.join('；'),
    Hotel: day.hotel || '',
    Transport: day.transport || '',
    Notes: day.notes || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itinerary')
  XLSX.writeFile(workbook, `${itinerary.title}.xlsx`)
}

