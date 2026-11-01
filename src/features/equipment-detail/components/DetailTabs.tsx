import { cn } from '@/shared/lib/cn'

export type DetailTabId = 'trend' | 'log' | 'alarm'

interface DetailTabsProps {
  tab: DetailTabId
  alarmCount: number
  onChange: (tab: DetailTabId) => void
}

const TABS: { id: DetailTabId; label: string }[] = [
  { id: 'trend', label: '작업 추이' },
  { id: 'log', label: '작업 기록' },
  { id: 'alarm', label: '알림' },
]

export default function DetailTabs({ tab, alarmCount, onChange }: DetailTabsProps) {
  return (
    <div className="flex h-11 rounded border border-border-default bg-bg-surface-2 p-1">
      {TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded text-label',
            tab === item.id ? 'bg-primary-fill font-semibold text-text-primary' : 'text-text-secondary',
          )}
        >
          {item.label}

          {item.id === 'alarm' && alarmCount > 0 && (
            <span className="rounded bg-status-error/16 px-1 text-caption text-status-error tabular-nums">{alarmCount}</span>
          )}
        </button>
      ))}
    </div>
  )
}
