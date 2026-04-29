import ExcelJS from 'exceljs'
import type { Itinerary } from '../types/itinerary'

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DEFAULT_CELL_VALUE = 'N/A'

const EXPORT_COLUMNS = [
  { header: '日期 Date', key: 'date', width: 15 },
  { header: '国家 Country', key: 'country', width: 14 },
  { header: '城市 City', key: 'city', width: 15 },
  { header: '行程安排 Activities', key: 'touringSports', width: 52 },
  { header: '时间 Time', key: 'time', width: 16 },
  { header: '交通 Transportation', key: 'transportation', width: 22 },
  { header: '住宿 Accommodation', key: 'accomodation', width: 24 },
] as const

type ExportColumnKey = (typeof EXPORT_COLUMNS)[number]['key']
type MergedColumnKey = Exclude<ExportColumnKey, 'touringSports' | 'time'>

const MERGED_COLUMN_KEYS: MergedColumnKey[] = [
  'date',
  'country',
  'city',
  'transportation',
  'accomodation',
]

const COLUMN_INDEX_BY_KEY = EXPORT_COLUMNS.reduce(
  (result, column, index) => {
    result[column.key] = index + 1
    return result
  },
  {} as Record<ExportColumnKey, number>,
)

const BORDER_COLOR = { argb: 'FFD0D7DE' }
const HEADER_ROW_NUMBER = 3
const TOURING_SPORTS_CHARS_PER_LINE = 42
const DATA_ROW_BASE_HEIGHT = 22
const DATA_ROW_LINE_HEIGHT = 16
const DATA_ROW_VERTICAL_PADDING = 8
const DATA_ROW_MAX_HEIGHT = 92
const TIME_TOKEN_PATTERN =
  /\b\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\s*-\s*\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\b|\b(?:Morning|Afternoon|Evening|Night)\b|(?:上午|中午|下午|傍晚|晚上|夜间|全天)|\b\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\b/gi
const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2563EB' },
} as const
const TITLE_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8F0FF' },
} as const
const ODD_GROUP_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' },
} as const
const EVEN_GROUP_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
} as const

export interface TravelPlanActivityItem {
  touringSports: string
  time: string
}

export interface TravelPlanRow {
  date: string
  country: string
  city: string
  activities: TravelPlanActivityItem[]
  transportation: string
  accomodation: string
}

const HEADER_ALIASES: Record<ExportColumnKey, string[]> = {
  date: ['date', '日期'],
  country: ['country', '国家'],
  city: ['city', '城市'],
  touringSports: [
    'touringsports',
    'touringspots',
    'touringsport',
    'touringspot',
    'activities',
    'activity',
    'touring',
    'tour',
    '行程',
    '行程安排',
    '游玩项目',
    '活动',
    '景点',
  ],
  time: ['time', '时间'],
  transportation: [
    'transportation',
    'transport',
    'traffic',
    '出行方式',
    '交通',
  ],
  accomodation: [
    'accomodation',
    'accommodation',
    'hotel',
    '酒店',
    '住宿',
  ],
}

function getColumnLetter(columnNumber: number) {
  let dividend = columnNumber
  let columnName = ''

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return columnName
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName.replace(/[\\/:*?"<>|]/g, '_').trim()
  return sanitized || 'travel-plan'
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

function compressBlankLines(lines: string[]) {
  const normalizedLines: string[] = []

  lines.forEach((line) => {
    const previousLine = normalizedLines[normalizedLines.length - 1]
    if (!line && !previousLine) {
      return
    }

    normalizedLines.push(line)
  })

  return normalizedLines
}

function toPlainCellText(value?: string | null) {
  const source = value?.trim()

  if (!source) {
    return ''
  }

  const withStructure = source
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|h[1-6])>/gi, '\n')
    .replace(/<(p|div|section|article|h[1-6])[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(ul|ol)>/gi, '\n')

  const withoutMarkdown = withStructure
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(`)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${withoutMarkdown}</div>`, 'text/html')
  const textContent = doc.body.textContent ?? ''

  const normalizedLines = compressBlankLines(
    textContent
      .split('\n')
      .map((line) =>
        line
          .replace(/\s+/g, ' ')
          .replace(/^-\s+/, '• ')
          .trim(),
      )
      .map((line) => line.replace(/^•\s*/, '• ')),
  )

  return normalizedLines.join('\n').trim()
}

function normalizeCellValue(value?: string | null) {
  const normalized = toPlainCellText(value)
  return normalized || DEFAULT_CELL_VALUE
}

function getTextDisplayWidth(text: string) {
  return Array.from(text).reduce((width, character) => {
    const isWideCharacter = /[^\u0000-\u00ff]/.test(character)
    return width + (isWideCharacter ? 2 : 1)
  }, 0)
}

function estimateWrappedLineCount(
  text: string,
  charactersPerLine = TOURING_SPORTS_CHARS_PER_LINE,
) {
  return Math.max(
    1,
    text.split('\n').reduce((lineCount, segment) => {
      const segmentWidth = getTextDisplayWidth(segment.trim())
      return lineCount + Math.max(1, Math.ceil(segmentWidth / charactersPerLine))
    }, 0),
  )
}

function segmentTravelText(value?: string | null) {
  const normalized = toPlainCellText(value)

  if (!normalized) {
    return []
  }

  const segmented = normalized
    .replace(/\s+•\s+/g, '\n• ')
    .replace(
      /([A-Za-z)])(?=\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\s*-\s*\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)/g,
      '$1 ',
    )
    .replace(
      /([A-Za-z)])(?=\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\b)/g,
      '$1 ',
    )
    .replace(
      /(\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\s*-\s*\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)(?=[A-Z][a-z])/g,
      '$1\n',
    )
    .replace(
      /(\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)(?=[A-Z][a-z])/g,
      '$1\n',
    )
    .replace(
      /([A-Za-z)])(?=(Morning|Afternoon|Evening|Night)\b)/g,
      '$1 ',
    )
    .replace(
      /\b(Morning|Afternoon|Evening|Night)(?=[A-Z][a-z])/g,
      '$1\n',
    )
    .replace(
      /\b(Morning|Afternoon|Evening|Night)(?=\d{1,2}:\d{2})/g,
      '$1\n',
    )

  const rawItems = segmented.includes('\n')
    ? segmented.split('\n')
    : segmented.split(/[；;]+/)

  const items = rawItems
    .map((item) => item.trim())
    .filter(Boolean)

  return items
}

function extractTimeTokens(value?: string | null) {
  const normalized = toPlainCellText(value)

  if (!normalized || normalized === DEFAULT_CELL_VALUE) {
    return []
  }

  return Array.from(normalized.matchAll(TIME_TOKEN_PATTERN)).map((match) =>
    match[0].replace(/\s+/g, ' ').trim(),
  )
}

function extractActivityItem(value: string): TravelPlanActivityItem {
  const timeTokens = extractTimeTokens(value)
  const touringSports = value
    .replace(TIME_TOKEN_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^•\s*/, '')
    .trim()

  return {
    touringSports: touringSports || DEFAULT_CELL_VALUE,
    time: timeTokens.length > 0 ? timeTokens.join(' / ') : DEFAULT_CELL_VALUE,
  }
}

function buildActivityItems(
  touringSportsValue?: string | null,
  timeValue?: string | null,
) {
  const touringSportsItems = segmentTravelText(touringSportsValue)
  const explicitTimeItems = extractTimeTokens(timeValue)
  const activityItems =
    touringSportsItems.length > 0
      ? touringSportsItems.map((item) => extractActivityItem(item))
      : [{ touringSports: DEFAULT_CELL_VALUE, time: DEFAULT_CELL_VALUE }]

  if (explicitTimeItems.length === activityItems.length) {
    return activityItems.map((activityItem, index) => ({
      ...activityItem,
      time: explicitTimeItems[index] || activityItem.time,
    }))
  }

  if (explicitTimeItems.length > 1) {
    return activityItems.map((activityItem, index) => ({
      ...activityItem,
      time: explicitTimeItems[index] || activityItem.time,
    }))
  }

  if (
    explicitTimeItems.length === 1 &&
    activityItems.length === 1 &&
    activityItems[0].time === DEFAULT_CELL_VALUE
  ) {
    return [
      {
        ...activityItems[0],
        time: explicitTimeItems[0],
      },
    ]
  }

  return activityItems
}

function normalizeHeader(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[\s/\\_-]+/g, '')
    .trim()
    .toLowerCase()
}

function splitMarkdownRow(line: string) {
  const placeholder = '__ESCAPED_PIPE__'
  const normalized = line.trim().replace(/\\\|/g, placeholder)
  const content = normalized.replace(/^\|/, '').replace(/\|$/, '')

  return content
    .split('|')
    .map((cell) => cell.split(placeholder).join('|').trim())
}

function isDividerRow(line: string) {
  const cells = splitMarkdownRow(line)
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  )
}

function buildHeaderIndexMap(headers: string[]) {
  const headerIndexMap: Partial<Record<ExportColumnKey, number>> = {}

  headers.forEach((header, index) => {
    const normalizedHeader = normalizeHeader(header)

    ;(Object.keys(HEADER_ALIASES) as ExportColumnKey[]).forEach((key) => {
      if (headerIndexMap[key] !== undefined) {
        return
      }

      if (HEADER_ALIASES[key].includes(normalizedHeader)) {
        headerIndexMap[key] = index
      }
    })
  })

  const matchedColumns = Object.keys(headerIndexMap).length

  if (
    matchedColumns < 3 ||
    headerIndexMap.date === undefined ||
    headerIndexMap.city === undefined
  ) {
    return null
  }

  return headerIndexMap
}

function toTravelPlanRow(
  cells: string[],
  headerIndexMap: Partial<Record<ExportColumnKey, number>>,
): TravelPlanRow {
  const getCell = (key: ExportColumnKey) =>
    normalizeCellValue(
      headerIndexMap[key] === undefined ? '' : cells[headerIndexMap[key]],
    )

  return {
    date: getCell('date'),
    country: getCell('country'),
    city: getCell('city'),
    activities: buildActivityItems(
      headerIndexMap.touringSports === undefined
        ? ''
        : cells[headerIndexMap.touringSports],
      headerIndexMap.time === undefined ? '' : cells[headerIndexMap.time],
    ),
    transportation: getCell('transportation'),
    accomodation: getCell('accomodation'),
  }
}

function applyCellBorder(
  worksheet: ExcelJS.Worksheet,
  startRowNumber: number,
  endRowNumber: number,
) {
  for (let rowNumber = startRowNumber; rowNumber <= endRowNumber; rowNumber += 1) {
    for (
      let columnNumber = 1;
      columnNumber <= EXPORT_COLUMNS.length;
      columnNumber += 1
    ) {
      const cell = worksheet.getCell(rowNumber, columnNumber)

      cell.border = {
        top: {
          style: rowNumber === startRowNumber ? 'medium' : 'thin',
          color: BORDER_COLOR,
        },
        bottom: {
          style: rowNumber === endRowNumber ? 'medium' : 'thin',
          color: BORDER_COLOR,
        },
        left: {
          style: columnNumber === 1 ? 'medium' : 'thin',
          color: BORDER_COLOR,
        },
        right: {
          style: columnNumber === EXPORT_COLUMNS.length ? 'medium' : 'thin',
          color: BORDER_COLOR,
        },
      }
    }
  }
}

function applyGroupedRowLayout(
  worksheet: ExcelJS.Worksheet,
  travelPlanRow: TravelPlanRow,
  groupIndex: number,
) {
  const activityItems =
    travelPlanRow.activities.length > 0
      ? travelPlanRow.activities
      : [{ touringSports: DEFAULT_CELL_VALUE, time: DEFAULT_CELL_VALUE }]

  const startRowNumber = worksheet.rowCount + 1
  const groupFill = groupIndex % 2 === 0 ? ODD_GROUP_FILL : EVEN_GROUP_FILL

  activityItems.forEach((activityItem, index) => {
    worksheet.addRow({
      date: index === 0 ? travelPlanRow.date : '',
      country: index === 0 ? travelPlanRow.country : '',
      city: index === 0 ? travelPlanRow.city : '',
      touringSports: activityItem.touringSports,
      time: activityItem.time,
      transportation: index === 0 ? travelPlanRow.transportation : '',
      accomodation: index === 0 ? travelPlanRow.accomodation : '',
    })
  })

  const endRowNumber = worksheet.rowCount

  if (endRowNumber > startRowNumber) {
    MERGED_COLUMN_KEYS.forEach((key) => {
      worksheet.mergeCells(
        startRowNumber,
        COLUMN_INDEX_BY_KEY[key],
        endRowNumber,
        COLUMN_INDEX_BY_KEY[key],
      )
    })
  }

  applyCellBorder(worksheet, startRowNumber, endRowNumber)

  for (let rowNumber = startRowNumber; rowNumber <= endRowNumber; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const activityItem = activityItems[rowNumber - startRowNumber]
    const rowLineCount = Math.max(
      estimateWrappedLineCount(activityItem.touringSports),
      estimateWrappedLineCount(activityItem.time, 16),
    )

    for (
      let columnNumber = 1;
      columnNumber <= EXPORT_COLUMNS.length;
      columnNumber += 1
    ) {
      const cell = worksheet.getCell(rowNumber, columnNumber)
      const isTouringSportsColumn =
        columnNumber === COLUMN_INDEX_BY_KEY.touringSports
      const isTimeColumn = columnNumber === COLUMN_INDEX_BY_KEY.time

      cell.alignment = {
        vertical: isTouringSportsColumn ? 'top' : 'middle',
        horizontal: isTouringSportsColumn ? 'left' : 'center',
        wrapText: true,
      }
      cell.font = {
        name: 'Arial',
        size: 10,
        color: { argb: 'FF1F2937' },
      }
      cell.fill = groupFill

      if (isTouringSportsColumn) {
        cell.font = {
          name: 'Arial',
          size: 10,
          color: { argb: 'FF111827' },
        }
      }

      if (isTimeColumn) {
        cell.font = {
          name: 'Arial',
          size: 10,
          color: { argb: 'FF2563EB' },
        }
      }
    }

    row.height = clamp(
      rowLineCount * DATA_ROW_LINE_HEIGHT + DATA_ROW_VERTICAL_PADDING,
      DATA_ROW_BASE_HEIGHT,
      DATA_ROW_MAX_HEIGHT,
    )
  }
}

function createWorkbook(rows: TravelPlanRow[]) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Travel Plan', {
    views: [{ state: 'frozen', ySplit: HEADER_ROW_NUMBER }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.45,
        bottom: 0.45,
        header: 0.2,
        footer: 0.2,
      },
    },
  })
  const lastColumnNumber = EXPORT_COLUMNS.length
  const lastColumnLetter = getColumnLetter(lastColumnNumber)

  worksheet.columns = EXPORT_COLUMNS.map((column) => ({ ...column }))
  worksheet.mergeCells(1, 1, 1, lastColumnNumber)
  worksheet.mergeCells(2, 1, 2, lastColumnNumber)

  const titleCell = worksheet.getCell(1, 1)
  titleCell.value = 'Easy Tour 签证行程单'
  titleCell.font = {
    name: 'Arial',
    size: 16,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  }
  titleCell.fill = TITLE_FILL
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  const metaCell = worksheet.getCell(2, 1)
  metaCell.value = `Generated by Easy Tour · ${new Date().toLocaleDateString()}`
  metaCell.font = {
    name: 'Arial',
    size: 10,
    color: { argb: 'FF64748B' },
  }
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' }

  worksheet.getRow(1).height = 30
  worksheet.getRow(2).height = 20

  const headerRow = worksheet.getRow(HEADER_ROW_NUMBER)
  headerRow.values = EXPORT_COLUMNS.map((column) => column.header)
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = HEADER_FILL
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.height = 28
  applyCellBorder(worksheet, HEADER_ROW_NUMBER, HEADER_ROW_NUMBER)

  worksheet.autoFilter = {
    from: `A${HEADER_ROW_NUMBER}`,
    to: `${lastColumnLetter}${HEADER_ROW_NUMBER}`,
  }

  rows.forEach((row, index) => {
    applyGroupedRowLayout(worksheet, row, index)
  })

  worksheet.getColumn(COLUMN_INDEX_BY_KEY.date).numFmt = '@'
  worksheet.getColumn(COLUMN_INDEX_BY_KEY.time).numFmt = '@'

  return workbook
}

function buildRowsFromItinerary(itinerary: Itinerary): TravelPlanRow[] {
  return itinerary.days.map((day) => ({
    date: normalizeCellValue(day.date),
    country: normalizeCellValue(itinerary.country),
    city: normalizeCellValue(day.city),
    activities:
      day.activities.length > 0
        ? day.activities.map((activity) => extractActivityItem(activity))
        : [{ touringSports: DEFAULT_CELL_VALUE, time: DEFAULT_CELL_VALUE }],
    transportation: normalizeCellValue(day.transport),
    accomodation: normalizeCellValue(day.hotel),
  }))
}

export function extractTravelPlanRowsFromMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/)

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index]?.trim()
    const dividerLine = lines[index + 1]?.trim()

    if (!headerLine?.includes('|') || !dividerLine || !isDividerRow(dividerLine)) {
      continue
    }

    const headers = splitMarkdownRow(headerLine)
    const headerIndexMap = buildHeaderIndexMap(headers)

    if (!headerIndexMap) {
      continue
    }

    const rows: TravelPlanRow[] = []

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const rowLine = lines[rowIndex]?.trim()

      if (!rowLine) {
        break
      }

      if (!rowLine.includes('|')) {
        break
      }

      if (isDividerRow(rowLine)) {
        continue
      }

      const cells = splitMarkdownRow(rowLine)

      if (!cells.some((cell) => cell.trim())) {
        continue
      }

      rows.push(toTravelPlanRow(cells, headerIndexMap))
    }

    if (rows.length > 0) {
      return rows
    }
  }

  return []
}

export function hasTravelPlanTable(markdown: string) {
  return extractTravelPlanRowsFromMarkdown(markdown).length > 0
}

export async function exportTravelPlanRowsExcel(
  rows: TravelPlanRow[],
  fileName = 'travel-plan.xlsx',
) {
  if (rows.length === 0) {
    throw new Error('没有可导出的表格数据')
  }

  const workbook = createWorkbook(rows)
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer as ArrayBuffer, sanitizeFileName(fileName))
}

export async function exportMarkdownTableExcel(
  markdown: string,
  fileName = 'travel-plan.xlsx',
) {
  const rows = extractTravelPlanRowsFromMarkdown(markdown)

  if (rows.length === 0) {
    throw new Error('未识别到可导出的行程表格')
  }

  await exportTravelPlanRowsExcel(rows, fileName)
}

export async function exportItineraryExcel(itinerary: Itinerary) {
  await exportTravelPlanRowsExcel(
    buildRowsFromItinerary(itinerary),
    `${itinerary.title}.xlsx`,
  )
}
