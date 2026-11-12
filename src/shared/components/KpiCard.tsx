import type { ReactNode } from 'react'

import AnimatedNumber from '@/shared/components/AnimatedNumber'
import Card from '@/shared/components/Card'
import Sparkline from '@/shared/components/Sparkline'
import { cn } from '@/shared/lib/cn'
import type { SmoothTarget } from '@/shared/hooks/useSmoothValue'
import type { KpiItem } from '@/shared/types'

interface KpiCardProps {
  item: KpiItem
  icon: ReactNode
  /** 있으면 문자열 value 대신 연속 수량(오늘 처리량과 동일 소스) */
  liveValue?: SmoothTarget
}

export default function KpiCard({ item, icon, liveValue }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-1 text-caption text-text-secondary">
        {icon}

        {item.label}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="flex min-w-0 items-baseline gap-1">
          <span
            className={cn(
              'text-h1 tabular-nums',
              item.tone === 'error' ? 'text-status-error' : item.tone === 'success' ? 'text-status-success' : 'text-text-primary',
            )}
          >
            {liveValue !== undefined ? <AnimatedNumber value={liveValue} grouped /> : item.value}
          </span>

          {item.unit && <span className="text-caption text-text-tertiary">{item.unit}</span>}
        </p>

        {item.sub ? (
          <span
            className={cn(
              'shrink-0 pb-0.5 text-caption tabular-nums',
              item.tone === 'error' ? 'text-status-error' : 'text-text-tertiary',
            )}
          >
            {item.sub}
          </span>
        ) : item.sparkline ? (
          <Sparkline points={item.sparkline} />
        ) : null}
      </div>
    </Card>
  )
}
