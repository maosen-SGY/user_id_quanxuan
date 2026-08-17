import type {
  AudienceType,
  MarketingEventType,
  NotifyFrequency,
  NotifyMethod,
  PopupScene,
} from '../types/audience'

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  static: '静态',
  dynamic: '动态',
}

export const MARKETING_EVENT_LABELS: Record<MarketingEventType, string> = {
  points: '送积分',
  message: '单纯营销信息',
  benefit: '送权益',
}

export const NOTIFY_METHOD_LABELS: Record<NotifyMethod, string> = {
  email: '邮件',
  popup: '弹窗',
  sms: '短信',
}

export const POPUP_SCENE_LABELS: Record<PopupScene, string> = {
  expired_not_renewed_popup: '过期未续费弹窗',
  trial_expired_not_renewed_popup: '试用到期未续费弹窗',
}

export const POPUP_SCENE_OPTIONS = Object.entries(POPUP_SCENE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const NOTIFY_FREQUENCY_LABELS: Record<NotifyFrequency, string> = {
  daily: '每天',
  weekly: '每周',
  biweekly: '每双周',
  monthly: '每月',
}

export const NOTIFY_FREQUENCY_OPTIONS = Object.entries(
  NOTIFY_FREQUENCY_LABELS,
).map(([value, label]) => ({ value, label }))

export const DATA_SITE_OPTIONS = [
  { label: '巴西站', value: 'BR' },
  { label: '印尼站', value: 'ID' },
  { label: '中国站', value: 'CN' },
  { label: '美国站', value: 'US' },
  { label: '英国站', value: 'UK' },
  { label: '德国站', value: 'DE' },
  { label: '法国站', value: 'FR' },
  { label: '日本站', value: 'JP' },
]

export const POOL_OPTIONS = [
  { label: 'POOL001 - 巴西新人池', value: 'POOL001' },
  { label: 'POOL002 - 印尼新人池', value: 'POOL002' },
  { label: 'POOL003 - 中国新人池', value: 'POOL003' },
  { label: 'POOL004 - 美国达人点击未购买', value: 'POOL004' },
  { label: 'POOL005 - 英国商家新客', value: 'POOL005' },
  { label: 'POOL006 - 流失客户召回池', value: 'POOL006' },
  { label: 'POOL007 - 德国高潜用户池', value: 'POOL007' },
  { label: 'POOL008 - 日本达人促活池', value: 'POOL008' },
  { label: 'POOL009 - 东南亚拓展池', value: 'POOL009' },
  { label: 'POOL010 - 季度复盘成交池', value: 'POOL010' },
]

export function getPoolLabel(poolId?: string): string {
  if (!poolId) return '-'
  return POOL_OPTIONS.find((o) => o.value === poolId)?.label ?? poolId
}

export function getDataSiteLabel(dataSite?: string): string {
  if (!dataSite) return '-'
  return DATA_SITE_OPTIONS.find((o) => o.value === dataSite)?.label ?? dataSite
}

export const COUNTRY_OPTIONS = [
  { label: '美国', value: 'US' },
  { label: '英国', value: 'UK' },
  { label: '德国', value: 'DE' },
  { label: '法国', value: 'FR' },
  { label: '日本', value: 'JP' },
  { label: '印尼', value: 'ID' },
  { label: '泰国', value: 'TH' },
  { label: '越南', value: 'VN' },
  { label: '菲律宾', value: 'PH' },
  { label: '马来西亚', value: 'MY' },
]

export const USER_TYPE_OPTIONS = [
  { label: '达人', value: 'creator' },
  { label: '商家', value: 'merchant' },
  { label: '普通用户', value: 'normal' },
  { label: '高潜用户', value: 'high_potential' },
]

export const BEHAVIOR_TAG_OPTIONS = [
  { label: '多次点击clip未购买', value: 'click_clip_no_purchase' },
  { label: '已成交用户', value: 'purchased' },
  { label: '忠诚客户', value: 'loyal' },
  { label: '流失客户', value: 'churned' },
  { label: '近30天活跃', value: 'active_30d' },
]

export const DYNAMIC_TAG_OPTIONS = [
  { label: '新人标签', value: 'new_user_tag' },
  { label: '过期未续费', value: 'expired_not_renewed' },
  { label: '试用到期未续费', value: 'trial_expired_not_renewed' },
  { label: '高可能流失用户', value: 'high_churn_risk' },
]
