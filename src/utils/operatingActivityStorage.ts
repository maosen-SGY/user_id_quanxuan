export type OperatingActivityStatus = 'draft' | 'published'

export interface OperatingActivityRecord {
  id: string
  title: string
  audienceId: string
  startAt: string
  endAt: string
  status: OperatingActivityStatus
}

const STORAGE_KEY = 'operating_activities'

const MOCK_ACTIVITIES: OperatingActivityRecord[] = [
  {
    id: 'OA001',
    title: '默认运营活动示例',
    audienceId: 'AUD001',
    startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
  },
]

function buildDefaultValidBinding(): OperatingActivityRecord {
  return {
    id: 'OA001',
    title: '默认运营活动示例',
    audienceId: 'AUD001',
    startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
  }
}

function ensureDefaultValidBinding(records: OperatingActivityRecord[]): OperatingActivityRecord[] {
  const now = Date.now()
  const hasValidBinding = records.some((item) => {
    if (item.audienceId !== 'AUD001' || item.status !== 'published') return false
    const startAt = new Date(item.startAt).getTime()
    const endAt = new Date(item.endAt).getTime()
    return Number.isFinite(startAt) && Number.isFinite(endAt) && startAt <= now && now <= endAt
  })

  if (hasValidBinding) return records

  const defaultRecord = buildDefaultValidBinding()
  const index = records.findIndex((item) => item.id === defaultRecord.id)
  if (index === -1) {
    return [defaultRecord, ...records]
  }

  const next = [...records]
  next[index] = defaultRecord
  return next
}

function loadActivities(): OperatingActivityRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ACTIVITIES))
    return MOCK_ACTIVITIES
  }
  const parsed = JSON.parse(raw) as OperatingActivityRecord[]
  const normalized = ensureDefaultValidBinding(parsed)
  if (normalized !== parsed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }
  return normalized
}

function saveActivities(records: OperatingActivityRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function upsertOperatingActivity(
  record: Omit<OperatingActivityRecord, 'id'> & { id?: string },
): OperatingActivityRecord {
  const records = loadActivities()
  const nextId = record.id ?? `OA${String(records.length + 1).padStart(3, '0')}`
  const nextRecord: OperatingActivityRecord = {
    ...record,
    id: nextId,
  }
  const index = records.findIndex((item) => item.id === nextId)
  if (index === -1) {
    records.unshift(nextRecord)
  } else {
    records[index] = nextRecord
  }
  saveActivities(records)
  return nextRecord
}

export function getValidOperatingActivitiesByAudienceId(
  audienceId: string,
): OperatingActivityRecord[] {
  const now = Date.now()
  return loadActivities().filter((item) => {
    if (item.audienceId !== audienceId) return false
    if (item.status !== 'published') return false
    const startAt = new Date(item.startAt).getTime()
    const endAt = new Date(item.endAt).getTime()
    return Number.isFinite(startAt) && Number.isFinite(endAt) && startAt <= now && now <= endAt
  })
}
