import { Timeline } from '@/features/dashboard'
import { TONE_BG } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

interface Props {
  counts: { running: number; idle: number; error: number }
}

const CHIPS = [
  { key: 'running', label: '작동', tone: 'success' },
  { key: 'idle', label: '대기', tone: 'warning' },
  { key: 'error', label: '고장', tone: 'error' },
] as const

/** 제목 · 층 · 상태 칩(운반 장비 수, 재생 데이터) · LIVE + 타임라인 */
export default function WarehouseTitleRow({ counts }: Props) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-h2 font-semibold text-text-primary">창고 · AMR</h1>

        <span className="rounded border border-border-default px-2 text-caption text-text-secondary">1F</span>

        {CHIPS.map(({ key, label, tone }) => (
          <span key={key} className="flex items-center gap-1.5 rounded border border-border-default px-2 py-0.5 text-caption text-text-secondary">
            <span className={cn('size-2 rounded-full', TONE_BG[tone])} />
            {label} <b className="text-text-primary tabular-nums">{counts[key]}</b>
          </span>
        ))}

        <span className="ml-auto flex items-center gap-1.5 text-caption font-semibold text-status-error">
          <span className="size-2 animate-pulse rounded-full bg-status-error" />
          LIVE
        </span>
      </div>

      <Timeline />
    </div>
  )
}
