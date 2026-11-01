import type { SceneEquipment } from '@/shared/types'
import type { StatusFrame } from '@/shared/types/playback'

import { MOCK_RACK_LOAD } from '../config/warehouse.config'

export const RACK_ROWS = ['A', 'B', 'C']

export interface RackCell {
  id: string
  name: string
  x: number
  z: number
  /** 적재율 % (목업) */
  load: number
}

/** 고정 랙: x 열 3줄(A~C) × z 7칸 — 템플릿 배치 그대로 */
export function rackGrid(equipment: SceneEquipment[]): RackCell[][] {
  const fixed = equipment.filter((entry) => entry.kind === 'rack' && entry.settings?.rackType !== 'mobile')

  const lines = new Map<number, SceneEquipment[]>()

  for (const rack of fixed) {
    const key = Math.round(rack.x)

    lines.set(key, [...(lines.get(key) ?? []), rack])
  }

  return [...lines.values()]
    .filter((line) => line.length >= 7)
    .sort((a, b) => a[0].x - b[0].x)
    .slice(0, RACK_ROWS.length)
    .map((line, row) =>
      line
        .sort((a, b) => b.z - a.z)
        .slice(0, 7)
        .map((rack, col) => ({
          id: rack.id,
          name: `${RACK_ROWS[row]}-${col + 1}`,
          x: rack.x,
          z: rack.z,
          load: MOCK_RACK_LOAD[row]?.[col] ?? 0,
        })),
    )
}

/** 랙 작업 중인 지게차 → 가장 가까운 랙 칸 (포즈 없으면 템플릿 위치) */
export function rackTargets(
  cells: RackCell[],
  frame: StatusFrame | null,
  position: (id: string) => [number, number] | null,
) {
  const targets = new Map<string, RackCell>()

  if (!frame || !cells.length) return targets

  for (const [id, sample] of Object.entries(frame.equipment)) {
    if (!sample.label.includes('랙')) continue

    const at = position(id)

    if (!at) continue

    let best = cells[0]

    for (const cell of cells) {
      if (Math.hypot(cell.x - at[0], cell.z - at[1]) < Math.hypot(best.x - at[0], best.z - at[1])) best = cell
    }

    targets.set(id, best)
  }

  return targets
}
