import type { ReactNode } from 'react'

import Card from '@/shared/components/Card'
import Sparkline from '@/shared/components/Sparkline'
import { cn } from '@/shared/lib/cn'
import type { KpiItem } from '@/shared/types'

interface KpiCardProps {
  item: KpiItem
  icon: ReactNode
}

export default function KpiCard({ item, icon }: KpiCardProps) {
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
            {item.value}
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
