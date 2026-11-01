import { STATE_LABEL, usePlayback } from '@/features/playback'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { cn } from '@/shared/lib/cn'
import { uiStore } from '@/shared/stores/useUiStore'

const LIMIT = 40

/** 오늘 현황 · 기록 탭: 현재 재생 시점까지의 상태 변화 (최신순). 클릭 = 장비 선택 */
export default function HistoryList({ selectedId }: { selectedId: string | null }) {
  const { run, time, origins } = usePlayback()

  const origin = origins[origins.length - 1] ?? 0

  const events = (run?.events ?? []).filter((event) => event.t <= time).slice(-LIMIT).reverse()

  if (events.length === 0) {
    return <p className="flex h-16 items-center justify-center rounded bg-bg-surface-2 text-caption text-text-tertiary">기록이 없습니다</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {events.map((event) => (
        <li key={`${event.t}-${event.equipmentId}`}>
          <button
            type="button"
            onClick={() => uiStore.getState().toggleSelect(event.equipmentId)}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded px-3 text-left text-caption hover:bg-bg-surface-2',
              selectedId === event.equipmentId ? 'bg-primary-fill/16 text-text-primary' : 'text-text-secondary',
            )}
          >
            <span className="w-16 text-text-tertiary tabular-nums">{formatClock(origin + event.t * 1000, true)}</span>

            <span className="font-semibold text-text-primary">{event.equipmentId}</span>

            <span className="ml-auto">
              {STATE_LABEL[event.from]} → {STATE_LABEL[event.to]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
