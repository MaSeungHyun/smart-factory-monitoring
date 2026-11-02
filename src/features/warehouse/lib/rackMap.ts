import type { SceneEquipment } from '@/shared/types'
import type { StatusFrame } from '@/shared/types/playback'

import { RACK_FULL, RACK_SLOTS } from '../config/rackSlots.config'

export const RACK_ROWS = ['A', 'B', 'C', 'D']

export interface RackCell {
  id: string
  name: string
  x: number
  z: number
  /** 슬롯별 점유 (RACK_SLOTS 순서, 재생 데이터) */
  slots: boolean[]
  used: number
  /** 적재율 % */
  load: number
}

export interface RackSummary {
  used: number
  capacity: number
  percent: number
  full: number
}

/** 고정 랙: x 열 줄(A~D, 7칸 이상) × z 칸 — 템플릿 배치 그대로. 적재값은 rackCellsAt 로 채움 */
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
        .map((rack, col) => ({
          id: rack.id,
          name: `${RACK_ROWS[row]}-${col + 1}`,
          x: rack.x,
          z: rack.z,
          slots: RACK_SLOTS.map(() => false),
          used: 0,
          load: 0,
        })),
    )
}

/** 재생 시각의 슬롯 점유 → 칸 적재율 */
export function rackCellsAt(grid: RackCell[][], state: Map<string, boolean[]>) {
  return grid.map((row) =>
    row.map((cell) => {
      const slots = state.get(cell.id) ?? cell.slots

      const used = slots.filter(Boolean).length

      return { ...cell, slots, used, load: Math.round((used / RACK_SLOTS.length) * 100) }
    }),
  )
}

/** 전체 적재 X / 용량, 가동률, 가득 칸 수 */
export function rackSummary(state: Map<string, boolean[]>): RackSummary {
  let used = 0

  let capacity = 0

  let full = 0

  for (const slots of state.values()) {
    const count = slots.filter(Boolean).length

    used += count

    capacity += slots.length

    if (slots.length && (count / slots.length) * 100 >= RACK_FULL) full += 1
  }

  return { used, capacity, percent: capacity ? Math.round((used / capacity) * 100) : 0, full }
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
