import type { SceneEquipment } from '@/shared/types'
import type { PlaybackRun } from '@/shared/types/playback'
import type { SimVec3 } from '@/shared/types/runEvents'

import { RACK_MATCH_RADIUS, RACK_SLOTS } from '../config/rackSlots.config'

export type RackActivityKind = 'store' | 'retrieve'

export interface RackActivity {
  t: number
  rackId: string
  slot: number
  palletId: string
  kind: RackActivityKind
}

export interface RackTimeline {
  rackIds: string[]
  /** states[0] = 청크 시작 스냅샷, states[i + 1] = changes[i] 적용 후. 랙별 슬롯 팔레트 id | null */
  states: (string | null)[][][]
  changes: RackActivity[]
}

interface RackPose {
  id: string
  x: number
  z: number
  yaw: number
}

/** 슬롯 월드 위치 (robot_IK rackSlotPoint 와 같은 Y축 회전, 슬롯 로컬 x = 0) */
function slotPoint(rack: RackPose, slot: number) {
  const { y, z } = RACK_SLOTS[slot]

  return [rack.x + z * Math.sin(rack.yaw), y, rack.z + z * Math.cos(rack.yaw)]
}

/** 적재 위치 → 가장 가까운 랙 · 슬롯 */
function locate(racks: RackPose[], position: SimVec3) {
  let best: { rack: number; slot: number; distance: number } | null = null

  racks.forEach((rack, index) => {
    if (Math.hypot(rack.x - position[0], rack.z - position[2]) > RACK_MATCH_RADIUS) return

    RACK_SLOTS.forEach((_, slot) => {
      const point = slotPoint(rack, slot)

      const distance = Math.hypot(point[0] - position[0], point[1] - position[1], point[2] - position[2])

      if (!best || distance < best.distance) best = { rack: index, slot, distance }
    })
  })

  return best as { rack: number; slot: number; distance: number } | null
}

/** 랙을 떠나는 이벤트: 출하 또는 랙/월드가 아닌 운반체로 이동 (지게차 픽업) */
function leaves(kind: string, detail: string | null) {
  if (kind === 'ship') return true

  return kind === 'move' && detail !== 'rack' && detail !== 'world'
}

/** 스냅샷 랙 슬롯 + 팔레트 이벤트 → 시간순 랙 상태 (재생 시각은 이진 탐색으로 조회) */
export function buildRackTimeline(run: PlaybackRun, equipment: SceneEquipment[]): RackTimeline | null {
  if (!run.racks?.length) return null

  const scene = new Map(equipment.map((entry) => [entry.id, entry]))

  const racks: RackPose[] = run.racks.map(({ id }) => {
    const entry = scene.get(id)

    return { id, x: entry?.x ?? 0, z: entry?.z ?? 0, yaw: entry?.yaw ?? 0 }
  })

  let current = run.racks.map(({ slots }) => slots.map((slot) => (Array.isArray(slot) && slot[0] ? (slot[1] ?? '?') : null)))

  const where = new Map<string, [number, number]>()

  current.forEach((slots, rack) => slots.forEach((pallet, slot) => pallet && where.set(pallet, [rack, slot])))

  const states = [current]

  const changes: RackActivity[] = []

  const apply = (change: RackActivity, rack: number, pallet: string | null) => {
    current = current.map((slots, index) => (index === rack ? slots.map((value, slot) => (slot === change.slot ? pallet : value)) : slots))

    states.push(current)

    changes.push(change)
  }

  const events = [...(run.recording?.pallets ?? [])].filter((event) => event[0] >= 0).sort((a, b) => a[0] - b[0])

  for (const [t, palletId, kind, detail, position] of events) {
    const stored = where.get(palletId)

    if (stored && leaves(kind, detail)) {
      where.delete(palletId)

      apply({ t, rackId: racks[stored[0]].id, slot: stored[1], palletId, kind: 'retrieve' }, stored[0], null)

      continue
    }

    if (stored || kind !== 'move' || detail !== 'rack' || !position) continue

    const hit = locate(racks, position)

    if (!hit) continue

    where.set(palletId, [hit.rack, hit.slot])

    apply({ t, rackId: racks[hit.rack].id, slot: hit.slot, palletId, kind: 'store' }, hit.rack, palletId)
  }

  return { rackIds: racks.map((rack) => rack.id), states, changes }
}

/** t 시점까지 적용된 변경 수 (이진 탐색) */
export function rackChangesAt(timeline: RackTimeline, t: number) {
  let low = 0

  let high = timeline.changes.length

  while (low < high) {
    const mid = (low + high) >> 1

    if (timeline.changes[mid].t <= t) low = mid + 1
    else high = mid
  }

  return low
}

/** t 시점 랙 id → 슬롯 점유 */
export function rackStateAt(timeline: RackTimeline, t: number) {
  const state = timeline.states[rackChangesAt(timeline, t)]

  return new Map(timeline.rackIds.map((id, index) => [id, state[index].map(Boolean)]))
}
