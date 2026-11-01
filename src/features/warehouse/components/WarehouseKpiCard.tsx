import SegmentProgressBar from '@/shared/components/SegmentProgressBar'
import { formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

import type { WarehouseKpi } from '../lib/warehouseKpis'
import MockBadge from './MockBadge'

const FILL = { info: 'fill-primary-on-dark', success: 'fill-status-success', warning: 'fill-status-warning' }

export default function WarehouseKpiCard({ kpi }: { kpi: WarehouseKpi }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded border border-border-default bg-bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-label text-text-secondary">
        {kpi.label}

        {kpi.mock && <MockBadge />}

        {kpi.badge && (
          <span className={cn('ml-auto rounded px-1.5 text-[11px]', kpi.badge === '정상' ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning')}>
            {kpi.badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-h1 font-semibold text-text-primary tabular-nums">{formatNumber(kpi.value)}</span>

        <span className="text-caption text-text-tertiary">{kpi.unit}</span>

        <span className="ml-auto text-[11px] text-text-tertiary">{kpi.side}</span>
      </div>

      <SegmentProgressBar value={kpi.percent} count={24} height={8} fillClassName={FILL[kpi.tone]} />
    </div>
  )
}
