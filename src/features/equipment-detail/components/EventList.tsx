import { TONE_BORDER } from '@/shared/constants/status'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { cn } from '@/shared/lib/cn'

import type { RobotEvent } from '../lib/robotDetail'

const VISIBLE = 3

export default function EventList({ events }: { events: RobotEvent[] }) {
  if (events.length === 0) {
    return <p className="rounded bg-bg-surface-2 px-3 py-4 text-center text-caption text-text-tertiary">기록 없음</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {events.slice(0, VISIBLE).map((event) => (
        <li key={event.key} className={cn('rounded border-l-2 bg-bg-surface-2 px-3 py-2', TONE_BORDER[event.tone])}>
          <p className="truncate text-label text-text-primary">{event.text}</p>

          <p className="text-caption text-text-tertiary tabular-nums">{formatClock(event.at, true)}</p>
        </li>
      ))}
    </ul>
  )
}
