import * as XLSX from 'xlsx'

export function downloadUserIdExcelTemplate(): void {
  const rows: string[][] = [
    ['user_id'],
    ['10001'],
    ['10002'],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'template')
  XLSX.writeFile(workbook, 'audience_user_id_template.xlsx')
}

export async function parseUserIdsFromExcel(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
  })

  const userIds: string[] = []
  for (const row of rows) {
    if (!Array.isArray(row) || row.length === 0) continue
    const value = String(row[0]).trim()
    const normalizedValue = value.toLowerCase()
    const isHeader =
      normalizedValue === 'userid' ||
      normalizedValue === 'user_id' ||
      value === 'userId' ||
      value === '用户ID'
    if (value && !isHeader) {
      userIds.push(value)
    }
  }

  return [...new Set(userIds)]
}
