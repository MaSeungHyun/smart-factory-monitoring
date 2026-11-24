import { useCallback } from 'react'

import AnimatedNumber from '@/shared/components/AnimatedNumber'
import { RUN_TARGET, useContinuousCount, useKpiGetter } from '@/features/playback'
import { ArrowDownToLine, ArrowUpFromLine, ClipboardList, Layers, ScanLine, Truck, Workflow } from 'lucide-react'

import { flyToCameraBookmark } from '@/features/scene/lib/cameraBookmarks'
import SegmentBar from '@/shared/components/SegmentBar'
import { processStageCameraBookmark } from '@/shared/constants/processStageCamera'
import { withThroughputBase } from '@/shared/constants/throughputBase'
import StatusBadge from '@/shared/components/StatusBadge'
import { cn } from '@/shared/lib/cn'
import type { ProcessStage } from '@/shared/types'
import type { StatusFrame } from '@/shared/types/playback'

const STAGE_ICON = {
  inbound: ArrowDownToLine,
  conveyor: Workflow,
  scan: ScanLine,
  pallet: Layers,
  amr: Truck,
  outbound: ArrowUpFromLine,
  order: ClipboardList,
}

/** 출고 = 오늘 처리량과 같은 값 (출고 누적 + 시연용 베이스) */
const pickOutbound = (frame: StatusFrame) => withThroughputBase(Math.max(0, frame.counts.outbound))

export default function ProcessStageCard({ stage }: { stage: ProcessStage }) {
  const Icon = STAGE_ICON[stage.icon]

  const isOutbound = stage.icon === 'outbound'

  // 출고는 오늘 처리량과 동일하게 status 프레임 보간값 + 베이스 사용 (KPI ship 키로 덮지 않음)
  const liveOutbound = useContinuousCount(pickOutbound, isOutbound ? withThroughputBase(stage.value) : stage.value)

  const outboundPercent = useCallback(
    () => Math.min(100, (liveOutbound() / RUN_TARGET) * 100),
    [liveOutbound],
  )

  const value = useKpiGetter(isOutbound ? undefined : stage.valueKey, isOutbound ? liveOutbound : stage.value)

  const percent = useKpiGetter(isOutbound ? undefined : stage.percentKey, isOutbound ? outboundPercent : stage.percent)

  const bookmark = processStageCameraBookmark(stage.id)

  const className = cn(
    'flex min-w-0 flex-col rounded border bg-bg-surface-2 p-3.5',
    bookmark && 'h-full w-full cursor-pointer text-left',
    stage.status === 'error'
      ? 'border-status-error bg-status-error/16'
      : stage.status === 'warning'
        ? 'border-status-warning/50 bg-status-warning/10'
        : 'border-border-default',
  )

  const body = (
    <>
      <div className="flex items-center gap-2 text-label font-medium text-text-secondary">
        <Icon size={14} />

        {stage.name}

        <span className="ml-auto">
          <StatusBadge tone={stage.status} label={stage.statusLabel} />
        </span>
      </div>

      <div className="mt-auto flex items-baseline justify-between">
        <p className="flex items-baseline gap-1">
          <span className="text-h1 text-text-primary tabular-nums"><AnimatedNumber value={value} grouped /></span>

          <span className="text-caption text-text-tertiary">{stage.unit}</span>
        </p>

        <span className="text-caption text-text-secondary tabular-nums"><AnimatedNumber value={percent} suffix="%" /></span>
      </div>

      <SegmentBar percent={percent} tone={stage.status} segments={35} className="mt-2" />
    </>
  )

  if (!bookmark) return <div className={className}>{body}</div>

  return (
    <button
      type="button"
      className={className}
      aria-label={`${stage.name} ${bookmark}번 카메라 시점으로 이동`}
      onClick={() => flyToCameraBookmark(bookmark)}
    >
      {body}
    </button>
  )
}
