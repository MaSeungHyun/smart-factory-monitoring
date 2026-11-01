import type { PointerEvent } from 'react'

import { playbackStore, usePlayback } from '@/features/playback'
import { useNow } from '@/shared/hooks/useNow'
import { formatClock, useTimelineRange } from '@/shared/hooks/useTimelineRange'
import { cn } from '@/shared/lib/cn'

import { TIMELINE_HOURS } from '../data/dashboard.mock'

const TONE_DOT = { error: 'bg-status-error', warning: 'bg-status-warning', info: 'bg-primary-on-dark', success: 'bg-status-success' }

/** 실제 시각 타임라인: 현재 시각 -5h ~ +1h, 재생 구간 · 알람 · 재생 위치 · 현재 시각 표시 */
export default function Timeline() {
  const now = useNow(1000)

  const range = useTimelineRange(now)

  const { run, time, origins } = usePlayback()

  const origin = origins[origins.length - 1]

  const duration = run?.meta.duration ?? 0

  const clamp = (value: number) => `${Math.min(Math.max(value, 0), 1) * 100}%`

  const onSeek = (event: PointerEvent<HTMLDivElement>) => {
    if (!run) return

    if (event.type === 'pointermove' && !event.currentTarget.hasPointerCapture(event.pointerId)) return

    const box = event.currentTarget.getBoundingClientRect()

    const at = range.timeAt((event.clientX - box.left) / box.width)

    playbackStore.getState().seek((at - origin) / 1000)
  }

  const spanLeft = range.position(origin)

  const spanWidth = range.position(origin + duration * 1000) - spanLeft

  return (
    <div className="relative mt-[18px] h-9 shrink-0 border-b border-border-default text-caption text-text-tertiary tabular-nums">
      <div className="flex justify-between">
        {(run ? range.ticks.map((tick) => tick.label) : TIMELINE_HOURS).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-2 h-px bg-border-default" />

      {run && (
        <div
          data-timeline
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)

            onSeek(event)
          }}
          onPointerMove={onSeek}
          className="group absolute inset-x-0 bottom-0 h-5 cursor-pointer touch-none"
        >
          <div
            style={{ left: clamp(spanLeft), width: `${Math.max(spanWidth, 0.004) * 100}%` }}
            className="absolute bottom-1.5 h-1 rounded-full bg-primary-on-dark/40"
          />

          {run.alarms.map((alarm) => (
            <span
              key={alarm.id}
              style={{ left: clamp(range.position(origin + alarm.t * 1000)) }}
              className={cn('absolute bottom-1 size-2 -translate-x-1/2 rounded-full', TONE_DOT[alarm.severity])}
            />
          ))}

          <span
            style={{ left: clamp(range.position(origin + time * 1000)) }}
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
