import { lerpAngle } from '@/features/playback/lib/interpolate'

import type { DecodedBox, DecodedGrip } from './decodeBoxes'

/** 이보다 짧은 시간에 이 각도 이상 튀면, 올려 둔 뒤의 제자리 회전으로 본다 */
const SNAP = Math.PI * 0.75

const SNAP_DT = 0.5

/** 그리퍼를 놓은 뒤 이 시간 안에 일어나는 뒤집기만 본다 */
const LOOKAHEAD = 5

interface PlaceFix {
  /** 뒤집히기 직전 키프레임 */
  from: number
  /** 뒤집힌 키프레임 */
  at: number
  base: number
  delta: number
}

const cache = new WeakMap<DecodedBox, PlaceFix[]>()

function wrap(angle: number) {
  const turn = Math.PI * 2

  let value = angle % turn

  if (value > Math.PI) value -= turn

  if (value < -Math.PI) value += turn

  return value
}

function yawAt(box: DecodedBox, time: number) {
  const { times, poses } = box

  let index = 0

  while (index < times.length - 1 && times[index + 1] <= time) index += 1

  const next = Math.min(index + 1, times.length - 1)

  const span = times[next] - times[index]

  const k = span > 0 ? Math.min(Math.max((time - times[index]) / span, 0), 1) : 0

  return lerpAngle(poses[index * 4 + 3], poses[next * 4 + 3], k)
}

/** 내려놓은 뒤 제자리에서 크게 뒤집히는 한 스텝. 들고 있는 동안의 각은 건드리지 않는다 */
function snapAfter(box: DecodedBox, grip: DecodedGrip, limit: number): PlaceFix | null {
  let prevT = grip.end

  let prevY = yawAt(box, grip.end)

  for (let index = 0; index < box.times.length; index++) {
    const t = box.times[index]

    if (t <= grip.end) continue

    if (t > limit) break

    const yaw = box.poses[index * 4 + 3]

    const step = wrap(yaw - prevY)

    if (t - prevT <= SNAP_DT && Math.abs(step) >= SNAP) {
      return { from: prevT, at: t, base: prevY, delta: step }
    }

    prevT = t

    prevY = yaw
  }

  return null
}

function fixForGrip(box: DecodedBox, grip: DecodedGrip) {
  if (grip.synthetic) return null

  const next = box.own.find((segment) => segment[0] >= grip.end - 0.05)

  if (next?.[1] !== 'conveyor') return null

  return snapAfter(box, grip, Math.min(next[0] + 0.5, grip.end + LOOKAHEAD))
}

function fixesFor(box: DecodedBox) {
  const found = cache.get(box)

  if (found) return found

  const fixes = box.grips.flatMap((grip) => {
    const fix = fixForGrip(box, grip)

    return fix ? [fix] : []
  })

  cache.set(box, fixes)

  return fixes
}

/**
 * 컨베이어에 내려놓은 뒤 제자리에서 반 바퀴 뒤집는 기록만 뺀다.
 * 들고 있는 동안의 각은 그리퍼에 붙어 있어야 하므로 그대로 둔다.
 */
export function placeYaw(box: DecodedBox, time: number, yaw: number) {
  for (const fix of fixesFor(box)) {
    if (time < fix.from) continue

    if (time <= fix.at) return fix.base

    return yaw - fix.delta
  }

  return yaw
}
