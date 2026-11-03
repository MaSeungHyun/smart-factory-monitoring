import AnimatedNumber from '@/shared/components/AnimatedNumber'
import SegmentProgressBar from '@/shared/components/SegmentProgressBar'
import StatusBadge from '@/shared/components/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { followEquipment } from '@/shared/lib/equipmentActions'

import { LOW_BATTERY } from '../config/warehouse.config'
import type { Vehicle } from '../lib/vehicles'
import MockBadge from './MockBadge'
import VehicleIcon from './VehicleIcon'

interface Props {
  vehicle: Vehicle
  selected: boolean
  onSelect: (id: string) => void
}

const barFill = (vehicle: Vehicle) => {
  if (vehicle.category === 'rack') return 'fill-primary-on-dark'

  return vehicle.percent < LOW_BATTERY ? 'fill-status-warning' : 'fill-status-success'
}

/** 운반 장비 카드 412x84: 아이콘 · 코드 · 경로 · 상태, 배터리(랙은 적재) 막대 */
export default function VehicleCard({ vehicle, selected, onSelect }: Props) {
  const rack = vehicle.category === 'rack'

  return (
    <button
      type="button"
      data-equipment-id={vehicle.id}
      aria-pressed={selected}
      onClick={() => onSelect(vehicle.id)}
      onDoubleClick={() => followEquipment(vehicle.id)}
      className={cn(
        'flex h-[84px] w-full shrink-0 flex-col justify-between rounded border bg-bg-surface-2 px-3 py-2.5 text-left',
        selected ? 'border-primary-on-dark bg-primary-fill/16' : 'border-transparent hover:border-border-default hover:bg-bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded border border-border-default text-text-secondary">
          <VehicleIcon category={vehicle.category} />
        </span>

        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-label font-semibold text-text-primary">
            {vehicle.code}

            {vehicle.mock && <MockBadge />}
          </span>

          <span className="block truncate text-[11px] leading-4 text-text-tertiary">{vehicle.route}

            {vehicle.utilization !== undefined && ` · 가동 ${Math.round(vehicle.utilization)}%`}
          </span>
        </span>

        <span className="ml-auto">
          <StatusBadge tone={vehicle.tone} label={vehicle.statusLabel} />
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-text-tertiary tabular-nums">
        <span className="w-9 shrink-0">{rack ? '적재' : '배터리'}</span>

        <span className="w-12 shrink-0 text-text-secondary">{rack ? vehicle.usedSlots : `${vehicle.speed} m/s`}</span>

        <SegmentProgressBar value={vehicle.percent} count={30} height={8} fillClassName={barFill(vehicle)} className="flex-1" />

        <span className="w-9 shrink-0 text-right font-semibold text-text-primary"><AnimatedNumber value={vehicle.percent} suffix="%" /></span>
      </div>
    </button>
  )
}
