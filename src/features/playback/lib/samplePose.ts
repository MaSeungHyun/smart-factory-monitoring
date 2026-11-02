import type { PoseSample } from '@/shared/types/playback'

import { indexAt } from './frameAt'
import { catmull, lerpAngle } from './interpolate'
import { JOINT_INTERPOLATION } from './playbackConfig'

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

/** 관절 각(deg)도 같은 곡선 */
export function sampleJoint(track: number[][], index: number, next: number, k: number, joint: number) {
  const at = (frame: number) => track[Math.min(Math.max(frame, 0), track.length - 1)]?.[joint] ?? 0

  if (!JOINT_INTERPOLATION) return at(index)

  return catmull(at(index - 1), at(index), at(next), at(next + 1), k)
}
