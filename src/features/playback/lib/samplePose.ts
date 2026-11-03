import type { PoseSample } from '@/shared/types/playback'

import { indexAt } from './frameAt'
import { catmull, lerp, lerpAngle } from './interpolate'
import { JOINT_INTERPOLATION, JOINT_MAX_STEP_DEG } from './playbackConfig'

function axis(track: PoseSample[], index: number, channel: number, fallback: number) {
  const sample = track[Math.min(Math.max(index, 0), track.length - 1)]

  return sample ? sample[channel] : fallback
}

/** 포즈 샘플 사이를 곡선으로 잇는다. yaw 는 최단 각 */
export function samplePose(track: PoseSample[], times: number[], time: number) {
  const index = indexAt(times, time)

  const next = Math.min(index + 1, times.length - 1)

  const current = track[index]

  const upcoming = track[next] ?? current

  if (!current || !upcoming) return null

  const span = times[next] - times[index]

  const k = span > 0 ? Math.min(Math.max((time - times[index]) / span, 0), 1) : 0

  return {
    x: catmull(axis(track, index - 1, 0, current[0]), current[0], upcoming[0], axis(track, next + 1, 0, upcoming[0]), k),
    z: catmull(axis(track, index - 1, 2, current[2]), current[2], upcoming[2], axis(track, next + 1, 2, upcoming[2]), k),
    yaw: lerpAngle(current[3], upcoming[3], k),
  }
}

/** 두 샘플 사이가 정상 범위로 이어지는지 (언랩이 끊긴 큰 점프면 false) */
const continuous = (a: number, b: number) => Math.abs(b - a) <= JOINT_MAX_STEP_DEG

/**
 * 관절 각(deg): 기록 시각 기준으로 샘플 사이를 보간한다. 상태가 없어 탐색(seek) 시에도 바로 그 시각 자세가 된다.
 * 각도는 로드 때 언랩된 값을 그대로 쓰고(새 wrap 처리 없음), 큰 점프 구간은 보간 없이 이전 값을 유지한다
 */
export function sampleJoint(track: number[][], index: number, next: number, k: number, joint: number) {
  const at = (frame: number) => track[Math.min(Math.max(frame, 0), track.length - 1)]?.[joint] ?? 0

  const a = at(index)

  const b = at(next)

  if (JOINT_INTERPOLATION === 'step' || !continuous(a, b)) return a

  if (JOINT_INTERPOLATION === 'curve') {
    const before = at(index - 1)

    const after = at(next + 1)

    if (continuous(before, a) && continuous(b, after)) return catmull(before, a, b, after, k)
  }

  return lerp(a, b, k)
}
