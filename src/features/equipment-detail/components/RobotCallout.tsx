import InfoCard from '@/shared/components/InfoCard'
import StatusBadge from '@/shared/components/StatusBadge'

import type { RobotDetail } from '../lib/robotDetail'

/** 로봇 콜아웃 카드 254x136 */
export default function RobotCallout({ detail }: { detail: RobotDetail }) {
  const rows = [
    ['사이클', detail.cycle === null ? '—' : `${detail.cycle.toFixed(1)}초`],
    ['성공률', detail.success === null ? '—' : `${detail.success.toFixed(1)}%`],
    ['부하', detail.load === null ? '—' : `${detail.load}%`],
  ]

  return (
    <InfoCard className="w-[254px]">
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full border border-text-secondary text-caption text-text-primary">
          {detail.id.replace(/\D/g, '').slice(-1)}
        </span>

        <span className="text-label font-semibold text-text-primary">{detail.name}</span>

        <span className="ml-auto">
          <StatusBadge tone={detail.status} label={detail.statusLabel} />
        </span>
      </div>

      <dl className="mt-2 flex flex-col gap-1.5 border-t border-border-default pt-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex text-caption">
            <dt className="text-text-tertiary">{label}</dt>

            <dd className="ml-auto font-semibold text-text-primary tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </InfoCard>
  )
}
