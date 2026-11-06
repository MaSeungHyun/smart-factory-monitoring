import type { DecodedBox } from '@/features/boxes/lib/decodeBoxes'
import type { BoxOwnerSegment, PlaybackRun } from '@/shared/types/playback'

export type RobotRole = 'palletizing' | 'depalletizing'

/** 팔레트 위 박스 한 자리 (적재 시각부터 떠날 때까지) */
export interface PalletSlot {
  boxId: string
  x: number
  y: number
  z: number
  yaw: number
  at: number
  leave: number
  cell: number
  layer: number
}

/** 한 AMR 팔레트(여정)에서 집는 박스 자리 묶음. 고정 카메라 조준 단위 */
export interface PalletGroup {
  x: number
  y: number
  z: number
  yaw: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface PalletPlan {
  slots: PalletSlot[]
  /** 디팔레타이징만: slots[i] 가 속한 팔레트 묶음 = groups[slotGroup[i]] */
  groups?: PalletGroup[]
  slotGroup?: number[]
  cells: { x: number; z: number; yaw: number }[]
  layers: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** 팔레트에 놓인 뒤 이 시간(초) 안에 컨베이어로 넘어가면 투입 팔레트(IN-*)로 보고 컨베이어 적재로 친다 */
const TRANSFER_WINDOW_S = 1

/** 그립이 끝난 뒤 박스가 실제로 머무는 곳 (투입 팔레트를 거쳐 바로 컨베이어로 가면 conveyor) */
export function placedOn(own: BoxOwnerSegment[], end: number) {
  const index = own.findIndex((segment) => segment[0] >= end - 0.05 && segment[1] !== 'robot')

  if (index < 0) return null

  const next = own[index]

  const after = own[index + 1]

  if (next[1] === 'pallet' && after?.[1] === 'conveyor' && after[0] - next[0] < TRANSFER_WINDOW_S) return { kind: 'conveyor' as const, index: index + 1 }

  return { kind: next[1], index }
}

const roles = new WeakMap<PlaybackRun, Map<string, RobotRole | null>>()

/** 로봇이 놓은 박스의 다음 담당이 팔레트면 팔레타이징, 컨베이어면 디팔레타이징 (기록 다수결) */
export function robotRole(run: PlaybackRun, robotId: string): RobotRole | null {
  let cache = roles.get(run)

  if (!cache) roles.set(run, (cache = new Map()))

  if (cache.has(robotId)) return cache.get(robotId) ?? null

  let pallet = 0

  let conveyor = 0

  for (const box of run.boxes ?? []) {
    for (const [, end, robot, synthetic] of box.grip ?? []) {
      if (robot !== robotId || synthetic === 1) continue

      const placed = placedOn(box.own, end)

      if (placed?.kind === 'pallet') pallet += 1
      else if (placed?.kind === 'conveyor') conveyor += 1
    }
  }

  const role = pallet === 0 && conveyor === 0 ? null : pallet >= conveyor ? 'palletizing' : 'depalletizing'

  cache.set(robotId, role)

  return role
}

const placePlans = new WeakMap<DecodedBox[], Map<string, PalletPlan | null>>()

const pickPlans = new WeakMap<DecodedBox[], Map<string, PalletPlan | null>>()

/** time 직전(포함) 키프레임 자세. 직후 키는 1Hz 간격이라 AMR 이 이미 떠나며 돌고 있을 수 있다 */
function poseBefore(box: DecodedBox, time: number) {
  let index = box.times.findIndex((value) => value > time + 1e-3) - 1

  if (index < -1) index = box.times.length - 1

  index = Math.max(0, index)

  return [box.poses[index * 4], box.poses[index * 4 + 1], box.poses[index * 4 + 2], box.poses[index * 4 + 3]] as const
}

function buildPlan(raw: Omit<PalletSlot, 'cell' | 'layer'>[]): PalletPlan {
  raw.sort((a, b) => a.at - b.at)

  const cells: { x: number; z: number; yaw: number }[] = []

  const heights: number[] = []

  const slots = raw.map((slot) => {
    let cell = cells.findIndex((item) => Math.hypot(item.x - slot.x, item.z - slot.z) < 0.12)

    if (cell < 0) cell = cells.push({ x: slot.x, z: slot.z, yaw: slot.yaw }) - 1

    let layer = heights.findIndex((value) => Math.abs(value - slot.y) < 0.06)

    if (layer < 0) layer = heights.push(slot.y) - 1

    return { ...slot, cell, layer }
  })

  const order = heights.map((value, index) => [value, index]).sort((a, b) => a[0] - b[0]).map(([, index]) => index)

  for (const slot of slots) slot.layer = order.indexOf(slot.layer)

  return {
    slots,
    cells,
    layers: heights.length,
    minX: Math.min(...cells.map((cell) => cell.x)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
    minZ: Math.min(...cells.map((cell) => cell.z)),
    maxZ: Math.max(...cells.map((cell) => cell.z)),
  }
}

/** 같은 팔레트로 묶는 거리(m). 이보다 멀면 다른 AMR 팔레트로 본다 */
const PALLET_GROUP_RADIUS_M = 0.9

/** time 에 작업 중인 집기 자리. 없으면 다음 자리, 다 끝났으면 마지막 자리 */
export function activeSlot(plan: PalletPlan, time: number) {
  let next: PalletSlot | null = null

  for (const slot of plan.slots) {
    if (slot.at <= time && time < slot.leave) return slot

    if (slot.at > time && (!next || slot.at < next.at)) next = slot
  }

  return next ?? plan.slots[plan.slots.length - 1] ?? null
}

/** time 에 작업 중인 팔레트 묶음. 같은 팔레트 안에서는 박스를 집어도 바뀌지 않는다 */
export function activeGroup(plan: PalletPlan, time: number) {
  const slot = activeSlot(plan, time)

  if (!slot || !plan.groups || !plan.slotGroup) return null

  return plan.groups[plan.slotGroup[plan.slots.indexOf(slot)]] ?? null
}

/** 시간순으로 이어지는 집기 자리를 출발 팔레트(소유 id) · 거리로 묶는다 */
function groupSlots(slots: PalletSlot[], sources: Map<PalletSlot, string | null>) {
  const groups: PalletGroup[] = []

  const slotGroup: number[] = []

  let members: PalletSlot[] = []

  const close = () => {
    if (members.length === 0) return

    const minX = Math.min(...members.map((slot) => slot.x))

    const maxX = Math.max(...members.map((slot) => slot.x))

    const minZ = Math.min(...members.map((slot) => slot.z))

    const maxZ = Math.max(...members.map((slot) => slot.z))

    groups.push({ x: (minX + maxX) / 2, y: Math.max(...members.map((slot) => slot.y)), z: (minZ + maxZ) / 2, yaw: members[0].yaw, minX, maxX, minZ, maxZ })

    members = []
  }

  for (const slot of slots) {
    const first = members[0]

    const source = sources.get(slot) ?? null

    const same = first && (source !== null && source === sources.get(first) ? true : Math.hypot(slot.x - first.x, slot.z - first.z) < PALLET_GROUP_RADIUS_M)

    if (first && !same) close()

    members.push(slot)

    slotGroup.push(groups.length)
  }

  close()

  return { groups, slotGroup }
}

/** 로봇이 팔레트에 놓은 자리들을 모아 격자(칸 · 층)로 정리 */
export function palletPlan(boxes: DecodedBox[], robotId: string): PalletPlan | null {
  let cache = placePlans.get(boxes)

  if (!cache) placePlans.set(boxes, (cache = new Map()))

  if (cache.has(robotId)) return cache.get(robotId) ?? null

  const raw: Omit<PalletSlot, 'cell' | 'layer'>[] = []

  for (const box of boxes) {
    for (const grip of box.grips) {
      if (grip.robot !== robotId || grip.synthetic) continue

      const placed = placedOn(box.own, grip.end)

      if (!placed || placed.kind !== 'pallet') continue

      const index = placed.index

      const at = box.own[index][0]

      const [x, y, z, yaw] = poseBefore(box, at)

      raw.push({ boxId: box.id, x, y, z, yaw, at, leave: box.own[index + 1]?.[0] ?? box.end })
    }
  }

  const plan = raw.length === 0 ? null : buildPlan(raw)

  cache.set(robotId, plan)

  return plan
}

/** 디팔레타이징: 집기 시작 시각의 박스 자리(소스 팔레트)를 격자로 정리. 월드 좌표 */
export function pickPlan(boxes: DecodedBox[], robotId: string): PalletPlan | null {
  let cache = pickPlans.get(boxes)

  if (!cache) pickPlans.set(boxes, (cache = new Map()))

  if (cache.has(robotId)) return cache.get(robotId) ?? null

  const raw: Omit<PalletSlot, 'cell' | 'layer'>[] = []

  for (const box of boxes) {
    for (const grip of box.grips) {
      if (grip.robot !== robotId || grip.synthetic) continue

      // 내려놓는 곳이 컨베이어인 그립만 (디팔레타이징 집기)
      if (placedOn(box.own, grip.end)?.kind !== 'conveyor') continue

      const at = grip.claimed

      const [x, y, z, yaw] = poseBefore(box, at)

      // 집기 직전 박스를 갖고 있던 팔레트/AMR id (없으면 거리로 묶음)
      const owner = [...box.own].reverse().find((segment) => segment[0] <= at + 1e-3 && segment[1] !== 'robot')

      const source = owner?.[2] ?? null

      raw.push({ boxId: box.id, x, y, z, yaw, at, leave: grip.end, source } as Omit<PalletSlot, 'cell' | 'layer'>)
    }
  }

  const plan = raw.length === 0 ? null : buildPlan(raw)

  if (plan) {
    const sources = new Map(plan.slots.map((slot) => [slot, (slot as PalletSlot & { source?: string | null }).source ?? null]))

    Object.assign(plan, groupSlots(plan.slots, sources))
  }

  cache.set(robotId, plan)

  return plan
}
