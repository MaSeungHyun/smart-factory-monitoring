import { cn } from '@/shared/lib/cn'
import { flyToEquipment } from '@/shared/lib/equipmentActions'
import { uiStore } from '@/shared/stores/useUiStore'

import { RACK_LEVELS, RACK_SLOTS } from '../config/rackSlots.config'
import type { RackCell } from '../lib/rackMap'

interface Props {
  cell: RackCell
  busy?: string
  selected: boolean
}

function fill(load: number) {
  if (load >= 90) return 'bg-status-warning text-[#1a1408]'

  if (load >= 30) return 'bg-primary-fill text-text-primary'

  return 'bg-primary-on-dark text-[#06202c]'
}

/** 단별 점유 (위 5단 → 아래 1단), 예: "5단 2/3" */
function levels(cell: RackCell) {
  const perLevel = RACK_SLOTS.length / RACK_LEVELS

  return Array.from({ length: RACK_LEVELS }, (_, index) => RACK_LEVELS - index).map((level) => {
    const used = RACK_SLOTS.filter((slot, slotIndex) => slot.level === level && cell.slots[slotIndex]).length

    return `${level}단 ${used}/${perLevel}`
  })
}

/** 랙 맵 한 칸: 호버 툴팁, 클릭 = 그 랙 선택(3D 외곽), 더블클릭 = 이동 */
export default function RackCellButton({ cell, busy, selected }: Props) {
  return (
    <button
      type="button"
      data-rack-cell={cell.id}
      onClick={() => uiStore.getState().toggleSelect(cell.id)}
      onDoubleClick={() => flyToEquipment(cell.id)}
      className={cn(
        'group relative flex h-5 items-center justify-center rounded-sm text-[10px] leading-none tabular-nums hover:brightness-125',
        fill(cell.load),
        selected && 'ring-2 ring-white',
        busy && 'ring-2 ring-white',
      )}
    >
      {cell.load}

      {busy && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-bg-surface shadow">
          {busy}
        </span>
      )}

      <span
        className={cn(
          'pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 flex-col rounded border border-border-default bg-bg-base px-2 py-1 text-left text-[11px] font-normal whitespace-nowrap text-text-primary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100',
          busy ? 'bottom-[calc(100%+22px)]' : 'bottom-full mb-1.5',
        )}
      >
        <span>
          {cell.name} · 적재 {cell.used}/{cell.slots.length} ({cell.load}%){busy ? ` · ${busy} 적재 중` : ''}
        </span>

        <span className="text-[10px] text-text-tertiary">{levels(cell).join(' · ')}</span>
      </span>
    </button>
  )
}
