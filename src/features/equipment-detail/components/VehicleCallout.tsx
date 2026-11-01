import StatusBadge from '@/shared/components/StatusBadge'
import { TONE_BORDER, TONE_TEXT } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'
import type { EquipmentStatus } from '@/shared/types'

import type { VehicleDetail } from '../lib/vehicleDetail'

interface Row {
  label: string
  value: string
  tone?: EquipmentStatus
}

function rowsOf(detail: VehicleDetail): Row[] {
  const speed = `${detail.speed.toFixed(1)} m/s`

  if (detail.kind === 'agv') {
    return [
      { label: '속도', value: speed },
      { label: '모터 부하', value: `${detail.load}%`, tone: detail.overloaded ? 'error' : undefined },
      { label: '배터리', value: `${detail.battery}%` },
    ]
  }

  if (detail.kind === 'forklift') {
    return [
      { label: '속도', value: speed },
      { label: '배터리', value: `${detail.battery}%`, tone: detail.status === 'warning' ? 'warning' : undefined },
      { label: '작업', value: detail.task },
    ]
  }

  return [
    { label: '속도', value: speed },
    { label: '배터리', value: `${detail.battery}%`, tone: detail.status === 'warning' ? 'warning' : undefined },
    { label: '경로', value: detail.route },
  ]
}

/** 운반 장비 콜아웃. AGV 는 속도 · 모터 부하 · 배터리 */
export default function VehicleCallout({ detail }: { detail: VehicleDetail }) {
  return (
    <div className={cn('w-[254px] rounded border bg-[#121417] p-3', TONE_BORDER[detail.status])}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-text-secondary text-caption text-text-primary">
          {detail.badge}
        </span>

        <span className="truncate text-label font-semibold text-text-primary">{detail.code}</span>

        <span className="ml-auto">
          <StatusBadge tone={detail.status} label={detail.statusLabel} />
        </span>
      </div>

      <dl className="mt-2 flex flex-col gap-1.5 border-t border-border-default pt-2">
        {rowsOf(detail).map((row) => (
          <div key={row.label} className="flex gap-3 text-caption">
            <dt className="shrink-0 text-text-tertiary">{row.label}</dt>

            <dd className={cn('ml-auto truncate font-semibold tabular-nums', row.tone ? TONE_TEXT[row.tone] : 'text-text-primary')}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
