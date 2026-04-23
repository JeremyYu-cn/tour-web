import ExcelJS from 'exceljs'
import type { Itinerary } from '../types/itinerary'

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sanitizeFileName(fileName: string) {
  const sanitized = fileName.replace(/[\\/:*?"<>|]/g, '_').trim()
  return sanitized || 'itinerary'
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportItineraryExcel(itinerary: Itinerary) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Itinerary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  worksheet.columns = [
    { header: 'Day', key: 'day', width: 12 },
    { header: 'Date', key: 'date', width: 16 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'Activities', key: 'activities', width: 36 },
    { header: 'Hotel', key: 'hotel', width: 24 },
    { header: 'Transport', key: 'transport', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 },
  ]

  worksheet.getRow(1).font = { bold: true }

  itinerary.days.forEach((day) => {
    worksheet.addRow({
      day: `Day ${day.day}`,
      date: day.date,
      city: day.city,
      activities: day.activities.join('；'),
      hotel: day.hotel || '',
      transport: day.transport || '',
      notes: day.notes || '',
    })
  })

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = {
      vertical: 'top',
      wrapText: true,
    }

    if (rowNumber > 1) {
      row.height = 22
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer as ArrayBuffer, `${sanitizeFileName(itinerary.title)}.xlsx`)
}
