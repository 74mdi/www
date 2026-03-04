export type LighthouseCategory =
  | 'Performance'
  | 'Accessibility'
  | 'Best Practices'
  | 'SEO'

export type LighthouseScore = {
  category: LighthouseCategory
  score: number
}

export type ResponseSnapshot = {
  dateLabel: string
  p50Ms: number
  p95Ms: number
}

export const PERFORMANCE_UPDATED_AT = '2026-03-04T16:00:00.000Z'

export const LIGHTHOUSE_SCORES: LighthouseScore[] = [
  { category: 'Performance', score: 96 },
  { category: 'Accessibility', score: 100 },
  { category: 'Best Practices', score: 100 },
  { category: 'SEO', score: 100 },
]

export const UPTIME_SUMMARY = {
  windowLabel: '30d',
  uptimePercent: 99.98,
  incidents: 0,
  checks: 12960,
}

export const RESPONSE_SNAPSHOTS: ResponseSnapshot[] = [
  { dateLabel: '02/26', p50Ms: 173, p95Ms: 402 },
  { dateLabel: '02/27', p50Ms: 179, p95Ms: 417 },
  { dateLabel: '02/28', p50Ms: 168, p95Ms: 391 },
  { dateLabel: '03/01', p50Ms: 171, p95Ms: 405 },
  { dateLabel: '03/02', p50Ms: 166, p95Ms: 382 },
  { dateLabel: '03/03', p50Ms: 162, p95Ms: 376 },
  { dateLabel: '03/04', p50Ms: 158, p95Ms: 369 },
]

