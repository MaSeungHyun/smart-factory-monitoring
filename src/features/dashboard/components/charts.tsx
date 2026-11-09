import { useState, type ReactNode } from 'react'

import { formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

const W = 600

const H = 160

const PAD = 4

function Empty({ className }: { className?: string }) {
  return <p className={cn('flex items-center justify-center text-caption text-text-tertiary', className)}>데이터 수집 중…</p>
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('inline-block h-2 w-2', className)} />
      {label}
    </span>
  )
}

function ChartTooltip({ children, xPercent }: { children: ReactNode; xPercent: number }) {
  const left = Math.min(92, Math.max(8, xPercent))

  return (
    <div
      className="pointer-events-none absolute top-1 z-50 w-max max-w-none -translate-x-1/2 whitespace-nowrap rounded border border-border-default bg-bg-surface px-2 py-1 text-caption text-text-primary shadow-lg"
      style={{ left: `${left}%` }}
    >
      {children}
    </div>
  )
}

function TooltipMetric({ swatch, label, value }: { swatch?: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {swatch ? <span className={cn('inline-block size-1.5 shrink-0 rounded-sm', swatch)} /> : null}
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </span>
  )
}

/** 구간별 막대 2개열 + 누적 선 (robot_IK BarLineChart 축약) */
export function BarLineChart({
  labels,
  a,
  b,
  aLabel,
  bLabel,
}: {
  labels: string[]
  a: number[]
  b: number[]
  aLabel: string
  bLabel: string
}) {
  const [hover, setHover] = useState<number | null>(null)

  if (a.length < 1) return <Empty className="h-40" />

  const max = Math.max(1, ...a, ...b)

  const cumulative = b.reduce<number[]>((acc, value) => [...acc, (acc[acc.length - 1] ?? 0) + value], [])

  const cmax = Math.max(1, cumulative[cumulative.length - 1] ?? 1)

  const step = W / a.length

  const bar = Math.max(1, step / 2 - 1)

  const line = cumulative.map((value, index) => `${index * step + step / 2},${H - PAD - (value / cmax) * (H - 2 * PAD)}`).join(' ')

  const hoverX = hover !== null ? ((hover + 0.5) / a.length) * 100 : 0

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      {hover !== null ? (
        <ChartTooltip xPercent={hoverX}>
          <span className="inline-flex items-center gap-2">
            <span className="tabular-nums text-text-tertiary">{labels[hover]}</span>
            <TooltipMetric swatch="bg-text-tertiary/40" label={aLabel} value={formatNumber(a[hover] ?? 0)} />
            <TooltipMetric swatch="bg-primary-on-dark/70" label={bLabel} value={formatNumber(b[hover] ?? 0)} />
            <TooltipMetric swatch="bg-text-primary" label={`누적 ${bLabel}`} value={formatNumber(cumulative[hover] ?? 0)} />
          </span>
        </ChartTooltip>
      ) : null}

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label={`${aLabel} / ${bLabel}`}>
        {hover !== null ? (
          <line
            x1={hover * step + step / 2}
            x2={hover * step + step / 2}
            y1={0}
            y2={H}
            className="stroke-text-tertiary"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {a.map((value, index) => (
          <rect
            key={`a${index}`}
            x={index * step + 1}
            y={H - (value / max) * (H - PAD)}
            width={bar}
            height={(value / max) * (H - PAD)}
            className={cn(hover === index ? 'fill-text-tertiary/70' : 'fill-text-tertiary/40')}
          />
        ))}

        {b.map((value, index) => (
          <rect
            key={`b${index}`}
            x={index * step + 1 + bar}
            y={H - (value / max) * (H - PAD)}
            width={bar}
            height={(value / max) * (H - PAD)}
            className={cn(hover === index ? 'fill-primary-on-dark' : 'fill-primary-on-dark/70')}
          />
        ))}

        <polyline points={line} fill="none" className="stroke-text-primary" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />

        {hover !== null ? (
          <circle
            cx={hover * step + step / 2}
            cy={H - PAD - ((cumulative[hover] ?? 0) / cmax) * (H - 2 * PAD)}
            r={3}
            className="fill-text-primary"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {a.map((_, index) => (
          <rect
            key={`hit${index}`}
            x={index * step}
            y={0}
            width={step}
            height={H}
            className="fill-transparent"
            onMouseEnter={() => setHover(index)}
          />
        ))}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-text-tertiary">
        <span className="tabular-nums">{labels[0]}</span>

        <span className="flex gap-3">
          <Legend className="bg-text-tertiary/40" label={aLabel} />
          <Legend className="bg-primary-on-dark/70" label={bLabel} />
          <Legend className="h-px bg-text-primary" label={`누적 ${bLabel}`} />
        </span>

        <span className="tabular-nums">{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

/** 단일 시계열 선 차트 */
export function LineChart({
  values,
  labels,
  label,
  unit,
  max: fixedMax,
}: {
  values: (number | null)[]
  labels?: string[]
  label: string
  unit: string
  max?: number
}) {
  const [hover, setHover] = useState<number | null>(null)

  const numbers = values.filter((value): value is number => value !== null)

  if (numbers.length < 2) return <Empty className="h-32" />

  const max = fixedMax ?? Math.max(1, ...numbers)

  const step = W / Math.max(1, values.length - 1)

  const segments: string[] = []

  let current: string[] = []

  values.forEach((value, index) => {
    if (value === null) {
      if (current.length) segments.push(current.join(' '))

      current = []

      return
    }

    current.push(`${index * step},${H - PAD - (value / max) * (H - 2 * PAD)}`)
  })

  if (current.length) segments.push(current.join(' '))

  const last = numbers[numbers.length - 1]

  const hoverValue = hover !== null ? values[hover] : null

  const hoverX = hover !== null ? (hover / Math.max(1, values.length - 1)) * 100 : 0

  const hoverLabel = hover !== null ? (labels?.[hover] ?? `#${hover + 1}`) : ''

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      {hover !== null && hoverValue !== null ? (
        <ChartTooltip xPercent={hoverX}>
          <span className="inline-flex items-center gap-2">
            <span className="tabular-nums text-text-tertiary">{hoverLabel}</span>
            <TooltipMetric swatch="bg-status-success" label={label} value={`${hoverValue.toFixed(1)}${unit}`} />
          </span>
        </ChartTooltip>
      ) : null}

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full" role="img" aria-label={`${label} 추이`}>
        <line x1={0} x2={W} y1={H - PAD} y2={H - PAD} className="stroke-border-default" vectorEffect="non-scaling-stroke" />

        {hover !== null && hoverValue !== null ? (
          <line
            x1={hover * step}
            x2={hover * step}
            y1={0}
            y2={H}
            className="stroke-text-tertiary"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {segments.map((points, index) => (
          <polyline key={index} points={points} fill="none" className="stroke-status-success" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ))}

        {hover !== null && hoverValue !== null ? (
          <circle
            cx={hover * step}
            cy={H - PAD - (hoverValue / max) * (H - 2 * PAD)}
            r={3.5}
            className="fill-status-success"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {values.map((value, index) => {
          if (value === null) return null

          const hitW = Math.max(step, 12)

          return (
            <rect
              key={`hit${index}`}
              x={index * step - hitW / 2}
              y={0}
              width={hitW}
              height={H}
              className="fill-transparent"
              onMouseEnter={() => setHover(index)}
            />
          )
        })}
      </svg>

      <p className="mt-1 flex justify-between text-[10px] tabular-nums text-text-tertiary">
        <span>
          최근 {last.toFixed(1)}
          {unit}
        </span>

        <span>
          최대 {max.toFixed(1)}
          {unit}
        </span>
      </p>
    </div>
  )
}
