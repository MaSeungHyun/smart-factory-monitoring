import type { PalletEvent } from '@/shared/types/runEvents'

/** 이벤트 팔레트 그룹 이름. 템플릿 장비 id 와 겹치지 않게 접두어를 붙인다 */
export const palletNodeName = (id: string) => `pallet:${id}`

/** 조건 레일(rail-N) id. transfer 는 같은 kind 로 기록돼도 여기 넣지 않는다 */
const RAIL_CARRIER = /^rail-\d+$/

export function isRailCarrier(id: string | null | undefined) {
  return !!id && RAIL_CARRIER.test(id)
}

/** 경사 구간이 끝났다고 볼 진행축(z) 한 주기 이동 (m). 실제 오름은 0.1~0.7 m / 0.5 s */
const RAIL_CLIMB_SETTLE_Z = 0.04

/** 조건 레일 경사 각도 (rad). 녹화 박스 자세에서 관측된 최대 기울기 ≈ 4.7° */
const RAIL_CLIMB_PITCH = (4.7 * Math.PI) / 180

/** 경사 진입·이탈에 쓰는 진행 비율. 이 구간에서 ease-out 으로 기울기를 붙이거나 뗀다 */
const RAIL_CLIMB_EASE = 0.25

interface RailClimb {
  start: number
  end: number
  z0: number
  z1: number
}

const climbsOf = new WeakMap<PalletEvent[], RailClimb[]>()

/** 팔레트 id -> 시간순 이벤트 */
export function palletTracks(events: PalletEvent[]) {
  const tracks = new Map<string, PalletEvent[]>()

  for (const event of [...events].sort((a, b) => a.t - b.t)) {
    const list = tracks.get(event.id) ?? []

    list.push(event)

    tracks.set(event.id, list)
  }

  for (const list of tracks.values()) climbsOf.set(list, smoothRailClimb(list))

  return tracks
}

/** t 이하 마지막 이벤트 index (없으면 -1) */
export function palletEventAt(events: PalletEvent[], time: number) {
  let low = -1

  let high = events.length - 1

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (events[mid].t <= time) low = mid
    else high = mid - 1
  }

  return low
}

/** robot_IK pallets stream: move 최대 2 Hz */
export const MOVE_STEP = 0.5

function lerpAngle(a: number, b: number, k: number) {
  let delta = b - a

  if (delta > Math.PI) delta -= Math.PI * 2

  if (delta < -Math.PI) delta += Math.PI * 2

  return a + delta * k
}

function easeOut(t: number) {
  const u = Math.min(Math.max(t, 0), 1)

  return 1 - (1 - u) * (1 - u)
}

/** 진행 u(0~1) 에서 경사 기울기 비율. 양 끝은 0, 가운데는 1. 진입·이탈은 ease-out */
function pitchEnvelope(u: number) {
  const ease = RAIL_CLIMB_EASE

  if (u <= 0 || u >= 1) return 0

  if (u < ease) return easeOut(u / ease)

  if (u > 1 - ease) return 1 - easeOut((u - (1 - ease)) / ease)

  return 1
}

function railParent(event: PalletEvent | undefined) {
  return !!event?.pose && isRailCarrier(event.parentId)
}

/**
 * 조건 레일에 막 오른 구간의 높이 샘플은 약 2 Hz 로 ±3~7 cm 진동한다.
 * 진행축(z) 양 끝을 기준으로 높이·빗축을 다시 써서 흔들림을 없앤다.
 */
function smoothRailClimb(events: PalletEvent[]) {
  const climbs: RailClimb[] = []

  let index = 0

  while (index < events.length) {
    if (!railParent(events[index])) {
      index += 1

      continue
    }

    let last = index

    while (last + 1 < events.length && railParent(events[last + 1])) last += 1

    let end = index

    for (let step = index; step < last; step++) {
      const from = events[step].pose!

      const to = events[step + 1].pose!

      if (Math.abs(to[2] - from[2]) >= RAIL_CLIMB_SETTLE_Z) end = step + 1
      else break
    }

    const startPose = events[index].pose!

    const endPose = events[end].pose!

    const z0 = startPose[2]

    const z1 = endPose[2]

    const span = z1 - z0

    if (end - index >= 2 && Math.abs(span) > 1e-6) {
      const smoothX = Math.abs(endPose[0] - startPose[0]) < Math.abs(span)

      for (let step = index; step <= end; step++) {
        const pose = events[step].pose!

        const u = Math.min(Math.max((pose[2] - z0) / span, 0), 1)

        const x = smoothX ? startPose[0] + (endPose[0] - startPose[0]) * u : pose[0]

        const y = startPose[1] + (endPose[1] - startPose[1]) * u

        if (x !== pose[0] || y !== pose[1]) events[step] = { ...events[step], pose: [x, y, pose[2], pose[3]] }
      }
    }

    if (Math.abs(span) > 1e-6) climbs.push({ start: index, end, z0, z1 })

    index = last + 1
  }

  return climbs
}

function climbPitch(events: PalletEvent[], time: number, z: number) {
  const climbs = climbsOf.get(events)

  if (!climbs?.length) return 0

  for (const climb of climbs) {
    if (time < events[climb.start].t || time > events[climb.end].t) continue

    const span = climb.z0 - climb.z1

    if (Math.abs(span) < 1e-6) continue

    const u = Math.min(Math.max((climb.z0 - z) / span, 0), 1)

    // -Z 로 오르면 +X 피치(+Z 쪽이 낮아짐). 반대 진행은 부호를 뒤집는다
    const sign = span > 0 ? 1 : -1

    return sign * RAIL_CLIMB_PITCH * pitchEnvelope(u)
  }

  return 0
}

/**
 * time 의 팔레트 스트림 포즈 [x, y, z, yaw, pitch] (연속 move 사이 선형 보간).
 * 없거나(첫 이벤트 전 / 포즈 없음) 출하됐으면 false
 */
export function palletPoseAt(events: PalletEvent[], time: number, out: number[]) {
  const index = palletEventAt(events, time)

  const event = events[index]

  if (!event || event.kind === 'ship' || !event.pose) return false

  const from = event.pose

  const next = events[index + 1]

  const to = next?.kind === 'move' && next.pose ? next.pose : from

  // 포즈는 바뀔 때만 최대 2 Hz 로 기록된다. 간격이 더 길면 그동안 멈춰 있던 것 -> 다음 샘플 직전 한 주기만 보간
  const start = next ? Math.max(event.t, next.t - MOVE_STEP) : event.t

  const span = next ? next.t - start : 0

  const k = to !== from && span > 0 ? Math.min(Math.max((time - start) / span, 0), 1) : 0

  for (let axis = 0; axis < 3; axis++) out[axis] = from[axis] + (to[axis] - from[axis]) * k

  out[3] = lerpAngle(from[3], to[3], k)

  out[4] = climbPitch(events, time, out[2])

  return true
}