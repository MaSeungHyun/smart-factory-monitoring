import { Matrix4, Quaternion, Vector3 } from 'three'

import { indexAt } from '@/features/playback/lib/frameAt'
import type { PlaybackRun } from '@/shared/types/playback'

import {
  PRE_ALIGN_ANGULAR_SPEED,
  PRE_ALIGN_BASE_SETTLED,
  PRE_ALIGN_END_MARGIN,
  PRE_ALIGN_EPS,
  PRE_ALIGN_JERK_FACTOR,
  PRE_ALIGN_MIN_SECONDS,
} from '../constants/preAlign'

/** 팔 구간 하나의 미리 맞춤 회전: start 부터 duration 동안 angle(rad, Y축) 만큼 흡착점 기준으로 돈다 */
export interface PreAlignTurn {
  start: number
  duration: number
  angle: number
}

const UP = new Vector3(0, 1, 0)

const minimumJerk = (x: number) => {
  const k = Math.min(Math.max(x, 0), 1)

  return k * k * k * (10 + k * (-15 + 6 * k))
}

/** (-pi, pi] 로 감싼다. 직사각형 박스는 반 바퀴 돌아도 같은 칸이므로 (-pi/2, pi/2] 로 더 줄인다 (robot_IK 과 같음) */
export function shortestBoxTurn(angle: number) {
  let a = Math.atan2(Math.sin(angle), Math.cos(angle))

  if (a > Math.PI / 2) a -= Math.PI
  else if (a <= -Math.PI / 2) a += Math.PI

  return a
}

export const yawOf = (q: Quaternion) => Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z))

/**
 * robot_IK startBoxTurn: ALIGN_BASE(hand00 회전)이 끝나면 흡착점 기준으로 박스를 minimum-jerk 로 돌려 칸 각을 미리 맞춘다.
 * 기록에는 이 회전을 내는 관절이 없어서, hand00 트랙으로 정렬 끝 시각을 찾고 같은 속도·이징으로 재현한다.
 */
export function planPreAlign(run: PlaybackRun, robotId: string, start: number, end: number, angle: number): PreAlignTurn | null {
  if (Math.abs(angle) < PRE_ALIGN_EPS) return null

  const duration = Math.max(PRE_ALIGN_MIN_SECONDS, (Math.abs(angle) * PRE_ALIGN_JERK_FACTOR) / PRE_ALIGN_ANGULAR_SPEED)

  const latest = Math.max(start, end - PRE_ALIGN_END_MARGIN - duration)

  return { start: Math.min(baseSettledAt(run, robotId, start, end) ?? latest, latest), duration, angle }
}

/** hand00 이 놓는 시각 값에 (전체 이동의 PRE_ALIGN_BASE_SETTLED 안으로) 처음 들어와 머무는 시각 */
function baseSettledAt(run: PlaybackRun, robotId: string, start: number, end: number) {
  const track = run.tracks.joints[robotId]

  const times = run.tracks.t

  if (!track?.length || !times.length) return null

  const from = indexAt(times, start)

  const to = indexAt(times, end)

  const final = track[to]?.[0]

  if (final === undefined) return null

  let range = 0

  for (let i = from; i <= to; i++) range = Math.max(range, Math.abs((track[i]?.[0] ?? final) - final))

  if (range === 0) return null

  const limit = range * PRE_ALIGN_BASE_SETTLED

  let settled: number | null = null

  for (let i = from; i <= to; i++) {
    const near = Math.abs((track[i]?.[0] ?? final) - final) <= limit

    if (near && settled === null) settled = times[i]
    else if (!near) settled = null
  }

  return settled
}

const turn = new Quaternion()

const pivot = new Vector3()

const offset = new Vector3()

const position = new Vector3()

const rotation = new Quaternion()

const scale = new Vector3()

/** 박스 월드(out)를 흡착점(grip, 팔 끝 월드) 기준으로 time 의 진행만큼 돌린다 */
export function applyPreAlign(plan: PreAlignTurn, time: number, grip: Matrix4, out: Matrix4) {
  const angle = plan.angle * minimumJerk((time - plan.start) / plan.duration)

  if (angle === 0) return

  turn.setFromAxisAngle(UP, angle)

  pivot.setFromMatrixPosition(grip)

  out.decompose(position, rotation, scale)

  offset.copy(position).sub(pivot).applyQuaternion(turn)

  out.compose(position.copy(pivot).add(offset), rotation.premultiply(turn), scale)
}
