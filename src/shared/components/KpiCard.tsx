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

      <div className="mt-2 flex items-end justify-between">
        <p className="flex items-baseline gap-1">
          <span
            className={cn(
              'text-h1 tabular-nums',
              item.tone === 'error' ? 'text-status-error' : 'text-text-primary',
            )}
          >
            {item.value}
          </span>

          {item.unit && <span className="text-caption text-text-tertiary">{item.unit}</span>}

          {item.sub && <span className="text-caption text-text-tertiary tabular-nums">{item.sub}</span>}
        </p>

        {item.sparkline && <Sparkline points={item.sparkline} />}
      </div>
    </Card>
  )
}
