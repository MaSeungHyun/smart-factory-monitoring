import { useMemo } from 'react'

const HOUR = 3_600_000

const MINUTE = 60_000

export interface TimelineRange {
  start: number
  end: number
  ticks: Array<{ time: number; label: string }>
  /** epoch ms -> 0..1 */
  position: (time: number) => number
  /** 0..1 -> epoch ms */
  timeAt: (ratio: number) => number
}

const pad = (value: number) => String(value).padStart(2, '0')

export const formatClock = (time: number, seconds = false) => {
  const date = new Date(time)

  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  return seconds ? `${base}:${pad(date.getSeconds())}` : base
}

/** 창 길이에 맞춰 눈금 간격 (ms) */
function tickStep(length: number) {
  if (length > 6 * HOUR) return HOUR

  if (length > 2 * HOUR) return 30 * MINUTE

  if (length > HOUR) return 15 * MINUTE

  if (length > 30 * MINUTE) return 5 * MINUTE

  if (length > 10 * MINUTE) return MINUTE

  return 30_000
}

/** start~end 구간의 눈금 · 비율 변환 */
export function timelineRangeOf(start: number, end: number): TimelineRange {
  const length = Math.max(end - start, 1)

  const step = tickStep(length)

  const first = Math.ceil(start / step) * step

  const ticks: TimelineRange['ticks'] = []

  for (let time = first; time <= end + 1; time += step) {
    ticks.push({
      time,
      label: step < MINUTE ? formatClock(time, true) : formatClock(time),
    })
  }

  const position = (time: number) => (time - start) / length

  const timeAt = (ratio: number) => start + ratio * length

  return { start, end, ticks, position, timeAt }
}

/** 현재 시각 기준 [정시 - before, 정시 + after] 시간 창 + 눈금. custom 이 있으면 그 구간을 쓴다 */
export function useTimelineRange(
  now: Date,
  before = 5,
  after = 1,
  custom: { start: number; end: number } | null = null,
): TimelineRange {
  const hour = new Date(now).setMinutes(0, 0, 0)

  const customStart = custom ? custom.start : null

  const customEnd = custom ? custom.end : null

  return useMemo(() => {
    if (customStart !== null && customEnd !== null) return timelineRangeOf(customStart, customEnd)

    const start = hour - before * HOUR

    const end = hour + after * HOUR

    return timelineRangeOf(start, end)
  }, [hour, before, after, customStart, customEnd])
}

export const TIMELINE_HOUR_MS = HOUR

export const TIMELINE_MIN_SPAN_MS = 5 * MINUTE

export const TIMELINE_MAX_SPAN_MS = 12 * HOUR
