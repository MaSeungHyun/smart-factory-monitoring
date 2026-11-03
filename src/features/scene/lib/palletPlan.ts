import type { DecodedBox } from '@/features/boxes/lib/decodeBoxes'
import type { PlaybackRun } from '@/shared/types/playback'

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

export interface PalletPlan {
  slots: PalletSlot[]
  cells: { x: number; z: number; yaw: number }[]
  layers: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
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

      const next = box.own.find((segment) => segment[0] >= end - 0.05 && segment[1] !== 'robot')

      if (next?.[1] === 'pallet') pallet += 1
      else if (next?.[1] === 'conveyor') conveyor += 1
    }
  }

  const role = pallet === 0 && conveyor === 0 ? null : pallet >= conveyor ? 'palletizing' : 'depalletizing'

  cache.set(robotId, role)

  return role
}

const plans = new WeakMap<DecodedBox[], Map<string, PalletPlan | null>>()

function poseAfter(box: DecodedBox, time: number) {
  let index = box.times.findIndex((value) => value >= time)

  if (index < 0) index = box.times.length - 1

  return [box.poses[index * 4], box.poses[index * 4 + 1], box.poses[index * 4 + 2], box.poses[index * 4 + 3]] as const
}

/** 로봇이 팔레트에 놓은 자리들을 모아 격자(칸 · 층)로 정리 */
export function palletPlan(boxes: DecodedBox[], robotId: string): PalletPlan | null {
  let cache = plans.get(boxes)

  if (!cache) plans.set(boxes, (cache = new Map()))

  if (cache.has(robotId)) return cache.get(robotId) ?? null

  const raw: Omit<PalletSlot, 'cell' | 'layer'>[] = []

  for (const box of boxes) {
    for (const grip of box.grips) {
      if (grip.robot !== robotId || grip.synthetic) continue

      const index = box.own.findIndex((segment) => segment[0] >= grip.end - 0.05 && segment[1] !== 'robot')

      if (index < 0 || box.own[index][1] !== 'pallet') continue

      const at = box.own[index][0]

      const [x, y, z, yaw] = poseAfter(box, at)

      raw.push({ boxId: box.id, x, y, z, yaw, at, leave: box.own[index + 1]?.[0] ?? box.end })
    }
  }

  if (raw.length === 0) {
    cache.set(robotId, null)

    return null
  }

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

  const plan: PalletPlan = {
    slots,
    cells,
    layers: heights.length,
    minX: Math.min(...cells.map((cell) => cell.x)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
    minZ: Math.min(...cells.map((cell) => cell.z)),
    maxZ: Math.max(...cells.map((cell) => cell.z)),
  }

  cache.set(robotId, plan)

  return plan
}