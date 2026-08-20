export type AudienceType = 'static' | 'dynamic'
export type AudienceStatus = 'active' | 'inactive'
export type AudienceCreateStatus = 'creating' | 'created'
export type MarketingEventType = 'points' | 'message' | 'benefit'
export type NotifyMethod = 'email' | 'popup' | 'sms'
export type NotifyFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type PopupScene =
  | 'expired_not_renewed_popup'
  | 'trial_expired_not_renewed_popup'

export interface MarketingEvent {
  type: MarketingEventType
  notifyMethods: NotifyMethod[]
  notifyFrequency?: NotifyFrequency
  popupScene?: PopupScene
  pointsAmount?: number
  benefitName?: string
  contents: Partial<Record<NotifyMethod, string>>
}

export interface DynamicTagColumn {
  tagIds: string[]
}

export interface DynamicTags {
  dataSite?: string
  poolId?: string
  tagColumns?: DynamicTagColumn[]
}

export interface Audience {
  id: string
  name: string
  description: string
  type: AudienceType
  status: AudienceStatus
  createStatus?: AudienceCreateStatus
  estimatedCoverage?: number
  validFrom?: string
  validTo?: string
  creator: string
  createdAt: string
  userIds?: string[]
  excelFileName?: string
  dynamicTags?: DynamicTags
  marketingEvents: MarketingEvent[]
}

export interface AudienceFilter {
  name?: string
  creator?: string
  createdAtStart?: string
  createdAtEnd?: string
}
