import { cn } from '@/shared/lib/cn'

import type { CycleBar } from '../lib/robotDetail'

interface CycleBarChartProps {
  bars: CycleBar[]
  average: number
  label: (t: number) => string
}

const HEIGHT = 120

/** 작업 속도 막대: 사이클(초/개), 평균선, 일시 정지(알람) 막대는 빨강 */
export default function CycleBarChart({ bars, average, label }: CycleBarChartProps) {
  const max = Math.max(average * 1.6, ...bars.map((bar) => bar.seconds), 1)

  const paused = bars.find((bar) => bar.paused)

  return (
    <div className="rounded border border-border-default bg-bg-surface-2 p-3">
      <div className="flex text-caption text-text-secondary">
        작업 속도

        <span className="ml-auto text-text-tertiary">단위 초/개</span>
      </div>

      {bars.length === 0 ? (
        <div style={{ height: HEIGHT }} className="mt-2 flex items-center justify-center text-caption text-text-tertiary">
          완료된 작업 없음 (0)
        </div>
      ) : (
        <div style={{ height: HEIGHT }} className="relative mt-2 flex items-end gap-1">
          {average > 0 && (
            <div style={{ bottom: `${(average / max) * 100}%` }} className="absolute inset-x-0 border-t border-dashed border-text-tertiary">
              <span className="absolute -top-4 right-0 text-[10px] text-text-tertiary">평균 {average.toFixed(1)}</span>
            </div>
          )}

          {bars.map((bar) => (
            <div
              key={`${bar.t}-${bar.paused}`}
              title={`${label(bar.t)} · ${bar.paused ? '일시 정지' : `${bar.seconds}초`}`}
              style={{ height: bar.paused ? '100%' : `${(bar.seconds / max) * 100}%` }}
              className={cn('min-w-0 flex-1 rounded-t-sm', bar.paused ? 'bg-status-error' : 'bg-primary-on-dark/80')}
            />
          ))}
        </div>
      )}

      {paused && (
        <p className="mt-1 text-[10px] text-status-error tabular-nums">
          {label(paused.t)} 일시 정지 · 0.0초
        </p>
      )}
    </div>
  )
}
