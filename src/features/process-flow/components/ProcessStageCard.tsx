import AnimatedNumber from '@/shared/components/AnimatedNumber'
import { ArrowDownToLine, ArrowUpFromLine, ClipboardList, Layers, ScanLine, Truck, Workflow } from 'lucide-react'

import SegmentBar from '@/shared/components/SegmentBar'
import StatusBadge from '@/shared/components/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { formatNumber } from '@/shared/lib/format'
import type { ProcessStage } from '@/shared/types'

const STAGE_ICON = {
  inbound: ArrowDownToLine,
  conveyor: Workflow,
  scan: ScanLine,
  pallet: Layers,
  amr: Truck,
  outbound: ArrowUpFromLine,
  order: ClipboardList,
}

export default function ProcessStageCard({ stage }: { stage: ProcessStage }) {
  const Icon = STAGE_ICON[stage.icon]

  const isError = stage.status === 'error'

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded border bg-bg-surface-2 p-3.5',
        isError ? 'border-status-error bg-status-error/16' : 'border-border-default',
      )}
    >
      <div className="flex items-center gap-2 text-label font-medium text-text-secondary">
        <Icon size={14} />

        {stage.name}

        <span className="ml-auto">
          <StatusBadge tone={stage.status} label={stage.statusLabel} />
        </span>
      </div>

      <div className="mt-auto flex items-baseline justify-between">
        <p className="flex items-baseline gap-1">
          <span className="text-h1 text-text-primary tabular-nums">{formatNumber(stage.value)}</span>

          <span className="text-caption text-text-tertiary">{stage.unit}</span>
        </p>

        <span className="text-caption text-text-secondary tabular-nums"><AnimatedNumber value={stage.percent} suffix="%" /></span>
      </div>

      <SegmentBar percent={stage.percent} tone={stage.status} segments={35} className="mt-2" />
    </div>
  )
}
