import { useUi } from '@/shared/hooks/useUi'

import type { RackCell } from '../lib/rackMap'
import MockBadge from './MockBadge'
import RackCellButton from './RackCellButton'

interface Props {
  grid: RackCell[][]
  /** 셀 id → 지금 그 칸으로 가는 장비 코드 (재생 데이터) */
  loading: Map<string, string>
}

/** 랙 적재 현황 A~C × 1~7 (적재율은 목업, 적재 중 하이라이트는 실데이터) */
export default function RackMapPanel({ grid, loading }: Props) {
  const { selectedId } = useUi()

  return (
    <div className="pointer-events-auto flex w-[300px] flex-col gap-2 rounded border border-border-default bg-bg-surface/95 p-3">
      <div className="flex items-center gap-2">
        <h3 className="text-label font-semibold text-text-primary">랙 적재 현황</h3>

        <MockBadge />

        <span className="ml-auto flex items-center gap-1 text-[10px] text-text-tertiary">
          <span className="size-2 rounded-sm bg-status-warning" />
          90% 이상
        </span>
      </div>

      {grid.map((row) => (
        <div key={row[0]?.id ?? 'row'} className="grid grid-cols-7 gap-1">
          {row.map((cell) => {
            const busy = loading.get(cell.id)

            return (
              <RackCellButton key={cell.id} cell={cell} busy={busy} selected={selectedId === cell.id} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
