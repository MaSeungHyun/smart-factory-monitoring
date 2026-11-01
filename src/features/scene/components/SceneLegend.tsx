import { TONE_BG, type Tone } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

const LEGEND: Array<{ tone: Tone; label: string }> = [
  { tone: 'running', label: '작동' },
  { tone: 'warning', label: '대기' },
  { tone: 'idle', label: '멈춤' },
  { tone: 'error', label: '고장' },
]

export default function SceneLegend() {
  return (
    <div className="pointer-events-auto flex h-11 w-[314px] items-center justify-between rounded border border-border-default bg-bg-surface/90 px-4 text-caption text-text-secondary">
      {LEGEND.map(({ tone, label }) => (
        <span key={label} className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', TONE_BG[tone])} />

          {label}
        </span>
      ))}
    </div>
  )
}
