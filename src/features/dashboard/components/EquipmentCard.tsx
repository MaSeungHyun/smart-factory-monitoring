import AnimatedNumber from '@/shared/components/AnimatedNumber'
import type { KeyboardEvent } from 'react'

import { Bot, ScanLine, Truck } from 'lucide-react'

import Card from '@/shared/components/Card'
import SegmentBar from '@/shared/components/SegmentBar'
import StatusBadge from '@/shared/components/StatusBadge'
import { openEquipment } from '@/shared/lib/equipmentActions'
import { uiStore } from '@/shared/stores/useUiStore'
import type { EquipmentItem } from '@/shared/types'

const TYPE_ICON = { robot: Bot, amr: Truck, scanner: ScanLine }

interface EquipmentCardProps {
  item: EquipmentItem
  selected?: boolean
}

/** 클릭: 선택 (3D 외곽 · 콜아웃), 더블클릭 / Enter: 그 장비로 이동 */
export default function EquipmentCard({ item, selected }: EquipmentCardProps) {
  const Icon = TYPE_ICON[item.type]

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') openEquipment(item.id)

    if (event.key === ' ') {
      event.preventDefault()

      uiStore.getState().toggleSelect(item.id)
    }
  }

  return (
    <Card
      interactive
      selected={selected}
      data-equipment-id={item.id}
      onClick={() => uiStore.getState().toggleSelect(item.id)}
      onDoubleClick={() => openEquipment(item.id)}
      onKeyDown={onKeyDown}
      className="h-20 shrink-0 px-3.5 py-2.5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-bg-surface text-text-secondary">
          <Icon size={16} className={selected ? 'text-primary-on-dark' : undefined} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text-primary">{item.name}</p>

          <p className="mt-0.5 text-caption text-text-tertiary">{item.process}</p>
        </div>

        <StatusBadge tone={item.status} label={item.statusLabel} />
      </div>

      <div className="mt-2 flex items-center gap-3 text-caption text-text-secondary tabular-nums">
        <span className="w-20 truncate">{item.metricLeft}</span>

        <span className="w-16">{item.metricRight}</span>

        <SegmentBar percent={item.percent} tone={item.status} segments={22} height={12} className="ml-auto" />

        <span className="w-8 text-right text-text-primary"><AnimatedNumber value={item.percent} suffix="%" /></span>
      </div>
    </Card>
  )
}
