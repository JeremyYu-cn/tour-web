import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Itinerary } from '../types/itinerary'

export function exportItineraryPdf(itinerary: Itinerary) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Easy Tour Itinerary', 14, 20)
  doc.setFontSize(12)
  doc.text(`Title: ${itinerary.title}`, 14, 30)
  doc.text(`Country: ${itinerary.country}`, 14, 38)
  doc.text(`Date: ${itinerary.departureDate} ~ ${itinerary.returnDate}`, 14, 46)
  doc.text(`Summary: ${itinerary.summary}`, 14, 54)

  autoTable(doc, {
    startY: 64,
    head: [['Day', 'Date', 'City', 'Activities', 'Hotel', 'Transport']],
    body: itinerary.days.map((day) => [
      `Day ${day.day}`,
      day.date,
      day.city,
      day.activities.join(' / '),
      day.hotel || '',
      day.transport || '',
    ]),
  })

  doc.save(`${itinerary.title}.pdf`)
}

