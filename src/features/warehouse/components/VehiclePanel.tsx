import { useRef, useState } from 'react'

import Panel from '@/shared/components/Panel'
import { useScrollToSelected } from '@/shared/hooks/useScrollToSelected'
import { useUi } from '@/shared/hooks/useUi'
import { statusVisible } from '@/shared/stores/uiStore'

import type { Vehicle } from '../lib/vehicles'
import DockSection from './DockSection'
import VehicleCard from './VehicleCard'
import VehicleTabs, { type VehicleFilter } from './VehicleTabs'

interface Props {
  vehicles: Vehicle[]
  selected: string | null
  onSelect: (id: string) => void
}

const MATCH: Record<VehicleFilter, (vehicle: Vehicle) => boolean> = {
  all: () => true,
  vehicle: (vehicle) => vehicle.category === 'amr' || vehicle.category === 'agv',
  forkRack: (vehicle) => vehicle.category === 'forklift' || vehicle.category === 'rack',
}

const countOf = (vehicles: Vehicle[], category: Vehicle['category']) => vehicles.filter((vehicle) => vehicle.category === category).length

/** 왼쪽 패널: 운반 장비 현황 (탭 · 카드 목록) + 출고 도크 */
export default function VehiclePanel({ vehicles, selected, onSelect }: Props) {
  const [filter, setFilter] = useState<VehicleFilter>('all')

  const ui = useUi()

  const list = useRef<HTMLDivElement>(null)

  useScrollToSelected(list, selected)

  const shown = vehicles.filter((vehicle) => MATCH[filter](vehicle) && statusVisible(vehicle.tone, ui))

  const counts = {
    all: vehicles.length,
    vehicle: vehicles.filter(MATCH.vehicle).length,
    forkRack: vehicles.filter(MATCH.forkRack).length,
  }

  const caption = `AMR ${countOf(vehicles, 'amr')} · AGV ${countOf(vehicles, 'agv')} · 지게차 ${countOf(vehicles, 'forklift')} · 랙 ${countOf(vehicles, 'rack')}`

  return (
    <Panel className="flex min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center">
        <h2 className="text-title text-text-primary">운반 장비 현황</h2>

        <span className="ml-auto text-[11px] text-text-tertiary">{caption}</span>
      </div>

      <VehicleTabs value={filter} counts={counts} onChange={setFilter} />

      <div ref={list} className="-mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2">
        {shown.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} selected={vehicle.id === selected} onSelect={onSelect} />
        ))}
      </div>

      <DockSection />
    </Panel>
  )
}
