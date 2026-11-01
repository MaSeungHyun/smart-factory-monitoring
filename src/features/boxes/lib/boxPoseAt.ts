import { indexAt } from '@/features/playback/lib/frameAt'

import type { DecodedBox } from './decodeBoxes'
import { placeYaw } from './placeYaw'

/** time 의 박스 포즈를 out [x, y, z, yaw] 에 채운다 (키프레임 선형 보간) */
export function boxPoseAt(box: DecodedBox, time: number, out: number[]) {
  const { times, poses } = box

  const index = indexAt(times, time)

  const next = Math.min(index + 1, times.length - 1)

  const span = times[next] - times[index]

  const k = span > 0 ? Math.min(Math.max((time - times[index]) / span, 0), 1) : 0

  for (let axis = 0; axis < 3; axis++) {
    out[axis] = poses[index * 4 + axis] + (poses[next * 4 + axis] - poses[index * 4 + axis]) * k
  }

  let delta = poses[next * 4 + 3] - poses[index * 4 + 3]

  if (delta > Math.PI) delta -= Math.PI * 2

  if (delta < -Math.PI) delta += Math.PI * 2

  out[3] = placeYaw(box, time, poses[index * 4 + 3] + delta * k)

  return out
}

/** time 의 담당 장비 종류 */
export function boxOwnerAt(box: DecodedBox, time: number) {
  let kind = box.own[0]?.[1] ?? 'none'

  for (const segment of box.own) {
    if (segment[0] > time) break

    kind = segment[1]
  }

  return kind
}
