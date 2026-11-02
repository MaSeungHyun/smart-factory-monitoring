import type { BoxGrip, BoxOwnerKind, BoxOwnerSegment, BoxTrack } from '@/shared/types/playback'
import type { SimBoxParentEvent, SimQuat, SimRecording } from '@/shared/types/runEvents'

import { indexAt } from './frameAt'

/** 키프레임은 1cm 이상 움직였을 때만 기록되므로 이보다 벌어지면 직전 값을 유지 키로 끼운다 */
const HOLD_GAP = 1.05

const OWNER: Record<string, BoxOwnerKind> = { conveyor: 'conveyor', arm: 'robot', amr: 'amr', pallet: 'pallet' }

const quatYaw = ([x, y, z, w]: SimQuat) => Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y))

type Key = [t: number, x: number, y: number, z: number]

// [1] 팔레트 yaw / 출하 시각

function palletIndex(recording: SimRecording) {
  const yaws = new Map<string, [number, number][]>()

  const shipped = new Map<string, number>()

  for (const [t, id, kind, , , yaw] of recording.pallets) {
    if (kind === 'ship' && !shipped.has(id)) shipped.set(id, t)

    if (typeof yaw === 'number') (yaws.get(id) ?? yaws.set(id, []).get(id)!).push([t, yaw])
  }

  const yawAt = (id: string, time: number) => {
    const list = yaws.get(id)

    if (!list?.length) return 0

    let yaw = list[0][1]

    for (const [t, value] of list) {
      if (t > time) break

      yaw = value
    }

    return yaw
  }

  return { yawAt, shipped }
}

// [2] 박스별 수집

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>()

  for (const item of items) (map.get(key(item)) ?? map.set(key(item), []).get(key(item))!).push(item)

  return map
}

function gripsOf(recording: SimRecording) {
  const open = new Map<string, [number, string]>()

  const grips = new Map<string, BoxGrip[]>()

  for (const [t, robot, on, box] of [...recording.suction].sort((a, b) => a[0] - b[0])) {
    const held = open.get(robot)

    if (held && (!on || held[1] !== box)) {
      ;(grips.get(held[1]) ?? grips.set(held[1], []).get(held[1])!).push([held[0], t, robot, 0])

      open.delete(robot)
    }

    if (on && box) open.set(robot, [t, box])
  }

  for (const [robot, [t, box]] of open) (grips.get(box) ?? grips.set(box, []).get(box)!).push([t, recording.seconds, robot, 0])

  return grips
}

function withHolds(keys: Key[]) {
  const out: Key[] = []

  for (const key of keys) {
    const last = out[out.length - 1]

    if (last && key[0] - last[0] > HOLD_GAP) out.push([key[0] - 1, last[1], last[2], last[3]])

    out.push(key)
  }

  return out
}

// [3] BoxTrack 인코딩 (기존 run.boxes 와 같은 형식이라 decodeBoxes 를 그대로 쓴다)

/** 녹화 v1 (스냅샷 포함, offset 제거된 시간) -> 기존 BoxTrack[] */
export function boxesFromRecording(recording: SimRecording, frameTimes: number[]): BoxTrack[] {
  const pallets = palletIndex(recording)

  const parents = groupBy([...recording.boxParents].sort((a, b) => a[0] - b[0]), (event) => event[1])

  const keys = new Map<string, Key[]>()

  for (const frame of [...recording.boxKeyframes].sort((a, b) => a.t - b.t)) {
    for (const [id, x, y, z] of frame.boxes) (keys.get(id) ?? keys.set(id, []).get(id)!).push([frame.t, x, y, z])
  }

  // 흡착 순간의 박스 윗면 (1Hz 키 사이 컨베이어 이동 오차를 없앤다)
  for (const contact of recording.contacts) {
    if (contact.boxId) keys.get(contact.boxId)?.push([contact.t, ...contact.boxTop])
  }

  for (const list of keys.values()) list.sort((a, b) => a[0] - b[0])

  const grips = gripsOf(recording)

  const boxes: BoxTrack[] = []

  for (const [id, raw] of keys) {
    const events: SimBoxParentEvent[] = parents.get(id) ?? []

    const parentAt = (time: number) => {
      let current: SimBoxParentEvent | undefined

      for (const event of events) {
        if (event[0] > time) break

        current = event
      }

      return current
    }

    const yawAt = (time: number, previous: number) => {
      const parent = parentAt(time)

      if (!parent || parent[2] === 'arm' || parent[2] === 'amr') return previous

      const local = quatYaw(parent[5])

      return parent[2] === 'pallet' && parent[3] ? pallets.yawAt(parent[3], time) + local : local
    }

    const list = withHolds(raw)

    const start = Math.min(list[0][0], events[0]?.[0] ?? Infinity)

    const gone = events.find((event) => event[2] === 'none')?.[0]

    const last = events[events.length - 1]

    const shipped = last?.[2] === 'pallet' && last[3] ? pallets.shipped.get(last[3]) : undefined

    const end = gone ?? (shipped !== undefined && shipped >= last[0] ? shipped : null)

    const f0 = indexAt(frameTimes, list[0][0])

    const k: number[] = []

    const p: number[] = []

    let frame = f0

    let yaw = 0

    for (const [t, x, y, z] of list) {
      const next = Math.max(indexAt(frameTimes, t), frame)

      k.push(next - frame)

      frame = next

      const raw = yawAt(t, yaw)

      // 보간이 반대로 돌지 않도록 직전 yaw 에 이어 붙인다
      yaw = raw + Math.round((yaw - raw) / (Math.PI * 2)) * Math.PI * 2

      p.push(Math.round(x * 100), Math.round(y * 100), Math.round(z * 100), Math.round(yaw * 100))
    }

    const own: BoxOwnerSegment[] = events.map(([t, , kind, parentId]) => [t, OWNER[kind] ?? 'none', parentId])

    boxes.push({
      id,
      t0: start,
      t1: end,
      src: events.find((event) => event[2] === 'conveyor')?.[3] ?? null,
      reason: shipped !== undefined && end === shipped ? 'outbound' : null,
      state: 'normal',
      own,
      grip: grips.get(id),
      f0,
      k,
      p,
    })
  }

  return boxes
}
