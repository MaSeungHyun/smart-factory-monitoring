import { cn } from '@/shared/lib/cn'

import type { Vehicle } from '../lib/vehicles'
import { vehicleTags } from '../lib/vehicleTags'

const register = (id: string) => (element: HTMLDivElement | null) => {
  if (element) vehicleTags.set(id, element)
  else vehicleTags.delete(id)
}

/** 작동 중(또는 선택된) 장비 콜아웃: 코드 · 경로 요약 · 속도. 위치는 VehicleTags3D 가 갱신 */
export default function VehicleTagOverlay({ vehicles, selected }: { vehicles: Vehicle[]; selected: string | null }) {
  const shown = vehicles.filter((vehicle) => !vehicle.mock && (vehicle.moving || vehicle.id === selected))

  return (
    <>
      {shown.map((vehicle) => (
        <div key={vehicle.id} ref={register(vehicle.id)} className="invisible absolute top-0 left-0">
          <span className="absolute bottom-0 left-0 h-9 w-px bg-status-success" />

          <span className="absolute -bottom-1 -left-1 size-2 rounded-full bg-status-success" />

          <span
            className={cn(
              'absolute bottom-9 -left-3 flex items-center gap-1.5 rounded border bg-bg-surface/95 px-2 py-1 text-[11px] whitespace-nowrap text-text-primary',
              vehicle.id === selected ? 'border-primary-on-dark' : 'border-status-success',
            )}
          >
            <b className="text-status-success">{vehicle.code}</b>

            <span className="text-text-secondary">{vehicle.short}</span>

            <span className="text-text-tertiary tabular-nums">{vehicle.speed} m/s</span>
          </span>
        </div>
      ))}
    </>
  )
}
