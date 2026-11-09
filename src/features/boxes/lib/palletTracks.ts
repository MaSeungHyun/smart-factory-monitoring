import type { PalletEvent } from '@/shared/types/runEvents'

/** 이벤트 팔레트 그룹 이름. 템플릿 장비 id 와 겹치지 않게 접두어를 붙인다 */
export const palletNodeName = (id: string) => `pallet:${id}`

/** 팔레트 id -> 시간순 이벤트 */
export function palletTracks(events: PalletEvent[]) {
  const tracks = new Map<string, PalletEvent[]>()

  for (const event of [...events].sort((a, b) => a.t - b.t)) {
    const list = tracks.get(event.id) ?? []

    list.push(event)

    tracks.set(event.id, list)
  }

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

/**
 * time 의 팔레트 스트림 포즈 [x, y, z, yaw] (연속 move 사이 선형 보간).
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

  return true
}
