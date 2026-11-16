import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'

import { playbackStore, usePlayback } from '@/features/playback'
import { useNow } from '@/shared/hooks/useNow'
import {
  formatClock,
  TIMELINE_HOUR_MS,
  TIMELINE_MAX_SPAN_MS,
  TIMELINE_MIN_SPAN_MS,
  timelineRangeOf,
} from '@/shared/hooks/useTimelineRange'
import { cn } from '@/shared/lib/cn'

import { TIMELINE_HOURS } from '../data/dashboard.mock'

const TONE_DOT = { error: 'bg-status-error', warning: 'bg-status-warning', info: 'bg-primary-on-dark', success: 'bg-status-success' }

/** 기본으로 보여주는 창 길이 (우측=최신) */
const DEFAULT_SPAN_MS = 6 * TIMELINE_HOUR_MS

/** 재생 구간 막대의 최소 폭 (타임라인 너비 대비 비율) */
const MIN_PLAY_SPAN_WIDTH = 0.004

/**
 * 타임라인: 최신 시각은 항상 우측.
 * - 기본(라이브): end=now 따라감, 왼쪽은 span 만큼 과거
 * - 스크롤: 창을 옮긴 뒤 그 시간 범위에 고정 (우측=그 구간의 최신)
 * - Shift+휠: 우측(최신) 고정한 채 확대·축소
 */
export default function Timeline() {
  const now = useNow(1000)

  const { run, time, origins } = usePlayback()

  const origin = origins[origins.length - 1]

  const duration = run?.meta.duration ?? 0

  /** null 이면 라이브(우측=now). 값이 있으면 스크롤로 고정한 창 */
  const [locked, setLocked] = useState<{ start: number; end: number } | null>(null)

  const [spanMs, setSpanMs] = useState(DEFAULT_SPAN_MS)

  const live = useMemo(() => {
    const end = now.getTime()

    return { start: end - spanMs, end }
  }, [now, spanMs])

  const range = useMemo(() => {
    if (locked) return timelineRangeOf(locked.start, locked.end)

    return timelineRangeOf(live.start, live.end)
  }, [locked, live])

  const rangeRef = useRef(range)

  const lockedRef = useRef(locked)

  const spanRef = useRef(spanMs)

  // 휠 핸들러가 최신 값을 읽도록 커밋 직후 ref 동기화
  useLayoutEffect(() => {
    rangeRef.current = range

    lockedRef.current = locked

    spanRef.current = spanMs
  }, [range, locked, spanMs])

  const root = useRef<HTMLDivElement>(null)

  const clamp = (value: number) => `${Math.min(Math.max(value, 0), 1) * 100}%`

  /** 눈금과 같은 0..1 좌표를 그대로 % 로 (창 밖이면 시크 영역이 잘라냄) */
  const percent = (value: number) => `${value * 100}%`

  const onSeek = (event: PointerEvent<HTMLDivElement>) => {
    if (!run) return

    if (event.type === 'pointermove' && !event.currentTarget.hasPointerCapture(event.pointerId)) return

    const box = event.currentTarget.getBoundingClientRect()

    const at = range.timeAt((event.clientX - box.left) / box.width)

    playbackStore.getState().seek((at - origin) / 1000)
  }

  useEffect(() => {
    const node = root.current

    if (!node) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()

      const { start, end } = rangeRef.current

      const span = end - start

      const box = node.getBoundingClientRect()

      // Shift+휠: 우측(최신) 고정, 왼쪽만 늘리거나 줄임
      if (event.shiftKey) {
        const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12

        const nextSpan = Math.min(TIMELINE_MAX_SPAN_MS, Math.max(TIMELINE_MIN_SPAN_MS, span * factor))

        if (lockedRef.current) {
          setLocked({ start: end - nextSpan, end })
        } else {
          setSpanMs(nextSpan)
        }

        return
      }

      // 휠: 시간축 이동 후 그 범위를 고정 (우측 = 이동한 구간의 최신)
      const deltaPx = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY

      const shift = (deltaPx / Math.max(box.width, 1)) * span

      const nextEnd = end + shift

      const nextStart = nextEnd - (lockedRef.current ? span : spanRef.current)

      setLocked({ start: nextStart, end: nextEnd })
    }

    node.addEventListener('wheel', onWheel, { passive: false })

    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  // 재생 구간: 눈금과 같은 시간→x 변환. 스크롤로 창 밖에 나간 부분은 시크 영역 경계에서 잘린다
  const spanLeft = range.position(origin)

  const spanWidth = Math.max(range.position(origin + duration * 1000) - spanLeft, MIN_PLAY_SPAN_WIDTH)

  return (
    <div ref={root} className="relative mt-[18px] h-9 shrink-0 touch-none border-b border-border-default text-caption text-text-tertiary tabular-nums">
      {run ? (
        range.ticks.map((tick) => {
          const at = range.position(tick.time)

          if (at < -0.02 || at > 1.02) return null

          return (
            <span key={tick.time} style={{ left: clamp(at) }} className="absolute top-0 -translate-x-1/2">
              {tick.label}
            </span>
          )
        })
      ) : (
        <div className="flex justify-between">
          {TIMELINE_HOURS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-2 h-px bg-border-default" />

      {run && (
        <div
          data-timeline
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)

            onSeek(event)
          }}
          onPointerMove={onSeek}
          className="group absolute inset-x-0 bottom-0 h-5 cursor-pointer overflow-hidden"
        >
          <div
            style={{ left: percent(spanLeft), width: percent(spanWidth) }}
            className="absolute bottom-1.5 h-1 rounded-full bg-primary-on-dark/40"
          />

          {run.alarms.map((alarm) => (
            <span
              key={alarm.id}
              style={{ left: percent(range.position(origin + alarm.t * 1000)) }}
              className={cn('absolute bottom-1 size-2 -translate-x-1/2 rounded-full', TONE_DOT[alarm.severity])}
            />
          ))}

          <span
            style={{ left: percent(range.position(origin + time * 1000)) }}
            className="absolute bottom-0 h-3 w-0.5 -translate-x-1/2 bg-text-primary transition-[height] duration-150 group-hover:h-4"
          />
        </div>
      )}

      <span
        style={{ left: clamp(range.position(now.getTime())) }}
        className="absolute bottom-3 -translate-x-1/2 rounded bg-primary-fill px-1.5 font-semibold text-text-primary"
      >
        {formatClock(now.getTime(), true)}
      </span>
    </div>
  )
}
