import type {
  Audience,
  AudienceCreateStatus,
  AudienceFilter,
  NotifyFrequency,
  PopupScene,
} from '../types/audience'

const STORAGE_KEY = 'audience_segments'
const DATA_VERSION = 'v10'

const CREATING_AUDIENCE_IDS = new Set(['AUD005', 'AUD007', 'AUD010'])
const MOCK_COVERAGE: Record<string, number> = {
  AUD001: 12840,
  AUD002: 5,
  AUD003: 3620,
  AUD004: 9150,
  AUD005: 6740,
  AUD006: 6,
  AUD007: 4820,
  AUD008: 15680,
  AUD009: 8,
  AUD010: 2390,
}

function toDateOnly(datetime: string): string {
  return datetime.slice(0, 10)
}

function plusOneYear(datetime: string): string {
  const date = toDateOnly(datetime)
  const [year, month, day] = date.split('-')
  return `${Number(year) + 1}-${month}-${day}`
}

function resolveCreateStatus(audience: Audience): AudienceCreateStatus {
  if (audience.createStatus) return audience.createStatus
  return CREATING_AUDIENCE_IDS.has(audience.id) ? 'creating' : 'created'
}

function resolveEstimatedCoverage(audience: Audience): number | undefined {
  if (typeof audience.estimatedCoverage === 'number') {
    return audience.estimatedCoverage
  }
  if (audience.type === 'static') {
    return audience.userIds?.length
  }
  return MOCK_COVERAGE[audience.id]
}

const FREQUENCY_CYCLE: NotifyFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly']
const POPUP_SCENES: PopupScene[] = [
  'expired_not_renewed_popup',
  'trial_expired_not_renewed_popup',
]
const LEGACY_POOL_TAG_MAP: Record<string, string[]> = {
  POOL001: ['new_user_tag'],
  POOL002: ['new_user_tag'],
  POOL003: ['new_user_tag'],
  POOL004: ['high_churn_risk'],
  POOL005: ['expired_not_renewed'],
  POOL006: ['high_churn_risk'],
  POOL007: ['trial_expired_not_renewed'],
  POOL008: ['new_user_tag'],
  POOL009: ['expired_not_renewed'],
  POOL010: ['trial_expired_not_renewed'],
}

function normalizeDynamicTags(
  tags?: Audience['dynamicTags'] & {
    country?: string
    userType?: string
    behaviorTag?: string
  },
): Audience['dynamicTags'] | undefined {
  if (!tags) return undefined
  if (tags.tagColumns?.length) {
    return {
      dataSite: tags.dataSite,
      tagColumns: tags.tagColumns.filter((item) => item.tagIds?.length),
    }
  }
  if (tags.poolId) {
    return {
      dataSite: tags.dataSite,
      poolId: tags.poolId,
      tagColumns: [{ tagIds: LEGACY_POOL_TAG_MAP[tags.poolId] ?? ['new_user_tag'] }],
    }
  }

  const legacyPoolMap: Record<string, string> = {
    US: 'POOL004',
    UK: 'POOL005',
    DE: 'POOL007',
    JP: 'POOL008',
    ID: 'POOL009',
    FR: 'POOL004',
  }

  return {
    dataSite: tags.dataSite ?? tags.country,
    poolId: legacyPoolMap[tags.country ?? ''] ?? 'POOL006',
  }
}

function normalizeAudiences(audiences: Audience[]): Audience[] {
  return audiences.map((audience, audienceIndex) => ({
    ...audience,
    createStatus: resolveCreateStatus(audience),
    estimatedCoverage: resolveEstimatedCoverage(audience),
    validFrom: audience.validFrom || toDateOnly(audience.createdAt),
    validTo: audience.validTo || plusOneYear(audience.createdAt),
    excelFileName:
      audience.excelFileName ||
      (audience.type === 'static' ? `${audience.name}.xlsx` : undefined),
    dynamicTags: normalizeDynamicTags(audience.dynamicTags),
    marketingEvents: [
      {
        ...(audience.marketingEvents[0] ?? {}),
        notifyMethods: ['popup'],
        popupScene:
          audience.marketingEvents[0]?.popupScene ??
          POPUP_SCENES[audienceIndex % POPUP_SCENES.length],
        notifyFrequency:
          audience.marketingEvents[0]?.notifyFrequency ??
          FREQUENCY_CYCLE[audienceIndex % FREQUENCY_CYCLE.length],
        contents: {},
      },
    ],
  }))
}

const MOCK_AUDIENCES: Audience[] = [
  {
    id: 'AUD001',
    name: '美国达人-点击未购买',
    description: '归属美国、身份为达人、多次点击clip但未购买的潜在客户',
    type: 'dynamic',
    status: 'active',
    creator: '张三',
    createdAt: '2026-07-01 10:30:00',
    dynamicTags: {
      dataSite: 'US',
      poolId: 'POOL004',
    },
    marketingEvents: [
      {
        type: 'points',
        notifyMethods: ['sms', 'email', 'popup'],
        pointsAmount: 50,
        contents: {
          sms: '恭喜您获得50积分奖励，快来体验Kalodata！',
          email: '尊敬的用户，您已获得50积分，点击查看详情。',
          popup: '您有50积分待领取，立即使用！',
        },
      },
    ],
  },
  {
    id: 'AUD002',
    name: '高价值客户回馈',
    description: '通过Excel导入的已成交高价值客户名单',
    type: 'static',
    status: 'active',
    creator: '李四',
    createdAt: '2026-07-05 14:20:00',
    userIds: ['10001', '10002', '10003', '10004', '10005'],
    marketingEvents: [
      {
        type: 'benefit',
        notifyMethods: ['email'],
        benefitName: 'VIP专属权益包',
        contents: {
          email: '感谢您一直以来的支持，专属VIP权益已为您开通。',
        },
      },
    ],
  },
  {
    id: 'AUD003',
    name: '流失客户召回',
    description: '近90天未活跃的流失客户群体',
    type: 'dynamic',
    status: 'inactive',
    creator: '王五',
    createdAt: '2026-06-15 09:00:00',
    dynamicTags: {
      poolId: 'POOL006',
    },
    marketingEvents: [
      {
        type: 'message',
        notifyMethods: ['popup', 'sms'],
        contents: {
          popup: '好久不见！回来探索最新功能吧。',
          sms: 'Kalodata有新功能上线，回来看看吧！',
        },
      },
    ],
  },
  {
    id: 'AUD004',
    name: '英国商家新客培育',
    description: '归属英国、身份为商家的新注册未成交用户',
    type: 'dynamic',
    status: 'active',
    creator: '赵六',
    createdAt: '2026-07-08 11:15:00',
    dynamicTags: {
      dataSite: 'UK',
      poolId: 'POOL005',
    },
    marketingEvents: [
      {
        type: 'points',
        notifyMethods: ['email', 'popup'],
        pointsAmount: 30,
        contents: {
          email: '欢迎加入Kalodata，30积分已到账，开启您的数据分析之旅。',
          popup: '新用户专享30积分，立即领取！',
        },
      },
    ],
  },
  {
    id: 'AUD005',
    name: '德国高潜用户转化',
    description: '德国地区高潜用户，近期频繁浏览但未付费',
    type: 'dynamic',
    status: 'active',
    creator: '张三',
    createdAt: '2026-07-10 09:45:00',
    dynamicTags: {
      dataSite: 'DE',
      poolId: 'POOL007',
    },
    marketingEvents: [
      {
        type: 'benefit',
        notifyMethods: ['email', 'sms'],
        benefitName: '7天免费试用权益',
        contents: {
          email: '专属7天免费试用已为您开通，立即体验全部功能。',
          sms: '您的7天免费试用权益已生效，快来体验！',
        },
      },
    ],
  },
  {
    id: 'AUD006',
    name: 'VIP忠诚客户答谢',
    description: '通过Excel导入的长期忠诚付费客户名单',
    type: 'static',
    status: 'active',
    creator: '李四',
    createdAt: '2026-07-11 16:30:00',
    userIds: ['20001', '20002', '20003', '20004', '20005', '20006'],
    marketingEvents: [
      {
        type: 'points',
        notifyMethods: ['email'],
        pointsAmount: 100,
        contents: {
          email: '感谢您的长期支持，100积分答谢礼已发放至您的账户。',
        },
      },
      {
        type: 'message',
        notifyMethods: ['popup'],
        contents: {
          popup: '忠诚客户专属福利已到账，感谢您的陪伴！',
        },
      },
    ],
  },
  {
    id: 'AUD007',
    name: '日本达人促活',
    description: '日本地区达人用户，近30天有活跃行为',
    type: 'dynamic',
    status: 'active',
    creator: '陈七',
    createdAt: '2026-07-12 08:20:00',
    dynamicTags: {
      dataSite: 'JP',
      poolId: 'POOL008',
    },
    marketingEvents: [
      {
        type: 'message',
        notifyMethods: ['popup', 'email'],
        contents: {
          popup: '达人专属数据分析报告已更新，快来查看！',
          email: '您的达人数据报告已生成，点击查看最新趋势分析。',
        },
      },
    ],
  },
  {
    id: 'AUD008',
    name: '东南亚新市场拓展',
    description: '印尼、泰国、越南地区普通用户群体',
    type: 'dynamic',
    status: 'inactive',
    creator: '王五',
    createdAt: '2026-06-20 14:00:00',
    dynamicTags: {
      dataSite: 'ID',
      poolId: 'POOL009',
    },
    marketingEvents: [
      {
        type: 'benefit',
        notifyMethods: ['sms'],
        benefitName: '新市场专属折扣券',
        contents: {
          sms: '东南亚专属优惠已上线，限时领取折扣券！',
        },
      },
    ],
  },
  {
    id: 'AUD009',
    name: '季度复盘-已成交用户',
    description: '本季度已成交用户，用于季度营销复盘推送',
    type: 'static',
    status: 'active',
    creator: '赵六',
    createdAt: '2026-07-13 10:00:00',
    userIds: ['30001', '30002', '30003', '30004', '30005', '30006', '30007', '30008'],
    marketingEvents: [
      {
        type: 'message',
        notifyMethods: ['email', 'popup', 'sms'],
        contents: {
          email: 'Q2季度数据报告已生成，查看您的业务增长洞察。',
          popup: '您的季度复盘报告已就绪，点击查看。',
          sms: 'Kalodata季度报告已生成，登录查看详情。',
        },
      },
    ],
  },
  {
    id: 'AUD010',
    name: '法国商家流失预警',
    description: '法国地区商家用户，已成交但近期活跃度下降',
    type: 'dynamic',
    status: 'active',
    creator: '陈七',
    createdAt: '2026-07-14 15:30:00',
    dynamicTags: {
      dataSite: 'FR',
      poolId: 'POOL004',
    },
    marketingEvents: [
      {
        type: 'points',
        notifyMethods: ['email', 'sms', 'popup'],
        pointsAmount: 80,
        contents: {
          email: '好久不见！80积分回馈礼等您领取，继续探索Kalodata。',
          sms: '专属80积分已到账，回来继续您的数据分析！',
          popup: '欢迎回来！80积分回馈礼等您领取。',
        },
      },
    ],
  },
]

function loadAudiences(): Audience[] {
  const versionKey = `${STORAGE_KEY}_version`
  const storedVersion = localStorage.getItem(versionKey)
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_AUDIENCES))
    localStorage.setItem(versionKey, DATA_VERSION)
    return normalizeAudiences(MOCK_AUDIENCES)
  }

  const normalized = normalizeAudiences(JSON.parse(stored) as Audience[])
  if (storedVersion !== DATA_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    localStorage.setItem(versionKey, DATA_VERSION)
  }
  return normalized
}

function saveAudiences(audiences: Audience[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(audiences))
}

export function getAudiences(filter?: AudienceFilter): Audience[] {
  let audiences = loadAudiences()

  if (filter?.name) {
    audiences = audiences.filter((a) =>
      a.name.toLowerCase().includes(filter.name!.toLowerCase()),
    )
  }
  if (filter?.creator) {
    audiences = audiences.filter((a) =>
      a.creator.toLowerCase().includes(filter.creator!.toLowerCase()),
    )
  }
  if (filter?.createdAtStart) {
    audiences = audiences.filter(
      (a) => a.createdAt >= filter.createdAtStart!,
    )
  }
  if (filter?.createdAtEnd) {
    audiences = audiences.filter((a) => a.createdAt <= filter.createdAtEnd!)
  }

  return audiences.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getAudienceById(id: string): Audience | undefined {
  return loadAudiences().find((a) => a.id === id)
}

export function createAudience(
  data: Omit<
    Audience,
    | 'id'
    | 'createdAt'
    | 'status'
    | 'createStatus'
    | 'estimatedCoverage'
    | 'validFrom'
    | 'validTo'
    | 'excelFileName'
  > &
    Partial<
      Pick<
        Audience,
        | 'createStatus'
        | 'estimatedCoverage'
        | 'validFrom'
        | 'validTo'
        | 'excelFileName'
      >
    >,
): Audience {
  const audiences = loadAudiences()
  const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const newAudience: Audience = {
    ...data,
    id: `AUD${String(audiences.length + 1).padStart(3, '0')}`,
    status: 'active',
    createdAt,
    createStatus:
      data.createStatus ?? (data.type === 'static' ? 'created' : 'creating'),
    estimatedCoverage:
      data.estimatedCoverage ??
      (data.type === 'static' ? data.userIds?.length : undefined),
    validFrom: data.validFrom ?? toDateOnly(createdAt),
    validTo: data.validTo ?? plusOneYear(createdAt),
  }
  audiences.unshift(newAudience)
  saveAudiences(audiences)
  return newAudience
}

export function updateAudienceConfig(
  id: string,
  patch: {
    marketingEvents?: Audience['marketingEvents']
    dynamicTags?: Audience['dynamicTags']
    validFrom?: string
    validTo?: string
    userIds?: string[]
    estimatedCoverage?: number
    excelFileName?: string
  },
): Audience | undefined {
  const audiences = loadAudiences()
  const index = audiences.findIndex((a) => a.id === id)
  if (index === -1) return undefined

  audiences[index] = {
    ...audiences[index],
    ...patch,
  }
  saveAudiences(audiences)
  return audiences[index]
}

export function toggleAudienceStatus(
  id: string,
  status: Audience['status'],
): Audience | undefined {
  const audiences = loadAudiences()
  const index = audiences.findIndex((a) => a.id === id)
  if (index === -1) return undefined

  audiences[index] = { ...audiences[index], status }
  saveAudiences(audiences)
  return audiences[index]
}

export function deleteAudienceById(id: string): boolean {
  const audiences = loadAudiences()
  const nextAudiences = audiences.filter((a) => a.id !== id)
  if (nextAudiences.length === audiences.length) {
    return false
  }
  saveAudiences(nextAudiences)
  return true
}
