import { cn } from '@/shared/lib/cn'
import { flyToEquipment } from '@/shared/lib/equipmentActions'
import { uiStore } from '@/shared/stores/uiStore'

import type { RackCell } from '../lib/rackMap'

interface Props {
  cell: RackCell
  busy?: string
  selected: boolean
}

/** 랙 맵 한 칸: 호버 툴팁, 클릭 = 그 랙 선택(3D 외곽), 더블클릭 = 이동 */
export default function RackCellButton({ cell, busy, selected }: Props) {
  return (
    <button
      type="button"
      data-rack-cell={cell.id}
      onClick={() => uiStore.toggleSelect(cell.id)}
      onDoubleClick={() => flyToEquipment(cell.id)}
      className={cn(
        'group relative flex h-9 flex-col items-center justify-center rounded-sm border text-[10px] leading-3 tabular-nums hover:brightness-125',
        busy
          ? 'animate-pulse border-status-success bg-status-success/25 text-text-primary'
          : cell.load >= 90
            ? 'border-status-warning/60 bg-status-warning/20 text-status-warning'
            : 'border-border-default bg-bg-surface-2 text-text-secondary',
        selected && 'ring-2 ring-primary-on-dark',
      )}
    >
      <span className="text-text-tertiary">{cell.name}</span>
      {cell.load}%

      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded border border-border-default bg-bg-base px-2 py-1 text-[11px] whitespace-nowrap text-text-primary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {cell.name} · 적재 {cell.load}%{busy ? ` · ${busy} 적재 중` : ''}
      </span>
    </button>
  )
}
