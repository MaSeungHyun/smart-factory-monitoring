import { useMemo } from 'react'

const HOUR = 3_600_000

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

/** 현재 시각 기준 [정시 - before, 정시 + after] 시간 창 + 1시간 눈금 */
export function useTimelineRange(now: Date, before = 5, after = 1): TimelineRange {
  const hour = new Date(now).setMinutes(0, 0, 0)

  return useMemo(() => {
    const start = hour - before * HOUR

    const end = hour + after * HOUR

    const ticks = Array.from({ length: before + after + 1 }, (_, index) => {
      const time = start + index * HOUR

      return { time, label: formatClock(time) }
    })

    const position = (time: number) => (time - start) / (end - start)

    const timeAt = (ratio: number) => start + ratio * (end - start)

    return { start, end, ticks, position, timeAt }
  }, [hour, before, after])
}
