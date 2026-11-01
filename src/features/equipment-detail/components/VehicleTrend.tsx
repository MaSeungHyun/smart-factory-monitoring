import { cn } from '@/shared/lib/cn'

import type { VehicleChart } from '../lib/vehicleDetail'

interface VehicleTrendProps {
  chart: VehicleChart
  label: (t: number) => string
}

const HEIGHT = 120

/** 종류별 추이 막대. 한도를 넘는 값은 경고색 */
export default function VehicleTrend({ chart, label }: VehicleTrendProps) {
  const max = Math.max(chart.floor, ...chart.bars.map((bar) => bar.value), 1)

  const alert = chart.limit === undefined ? undefined : [...chart.bars].reverse().find((bar) => bar.value > chart.limit!)

  return (
    <div className="rounded border border-border-default bg-bg-surface-2 p-3" title={chart.mock ? '목업 값 (재생 데이터 없음)' : undefined}>
      <div className="flex text-caption text-text-secondary">
        {chart.title}

        <span className="ml-auto text-text-tertiary">{chart.unit}</span>
      </div>

      {chart.bars.length === 0 ? (
        <div style={{ height: HEIGHT }} className="mt-2 flex items-center justify-center text-caption text-text-tertiary">
          기록 없음
        </div>
      ) : (
        <div style={{ height: HEIGHT }} className="relative mt-2 flex items-end gap-1">
          {chart.average > 0 && (
            <div style={{ bottom: `${(chart.average / max) * 100}%` }} className="absolute inset-x-0 border-t border-dashed border-text-tertiary">
              <span className="absolute -top-4 right-0 text-[10px] text-text-tertiary">
                평균 {chart.unit.includes('m/s') ? chart.average.toFixed(1) : Math.round(chart.average)}
                {chart.unit.includes('%') ? '%' : ''}
              </span>
            </div>
          )}

          {chart.bars.map((bar) => (
            <div
              key={bar.t}
              title={`${label(bar.t)} · ${bar.value}${chart.unit.includes('%') ? '%' : ''}`}
              style={{ height: `${(bar.value / max) * 100}%` }}
              className={cn('min-w-0 flex-1 rounded-t-sm', chart.limit !== undefined && bar.value > chart.limit ? 'bg-status-error' : 'bg-primary-on-dark/80')}
            />
          ))}
        </div>
      )}

      {alert && (
        <p className="mt-1 text-[10px] text-status-error tabular-nums">
          {label(alert.t)} 과부하 · {alert.value}%
        </p>
      )}
    </div>
  )
}
