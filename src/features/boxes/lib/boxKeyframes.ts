import { Quaternion, Vector3, type Matrix4 } from 'three'

import type { BoxKeyframe } from '@/shared/types/runEvents'

import { BOX_FLIP_SNAP } from '../constants/conveyorHandoff'

/** 계산 위치가 키프레임과 이만큼 넘게 어긋나면 키프레임으로 맞춘다 */
const DRIFT = 0.05

/** t 이하 마지막 키프레임 index (없으면 0) */
export function keyIndexAt(keys: BoxKeyframe[], time: number) {
  let low = 0

  let high = keys.length - 1

  if (high < 0 || time <= keys[0][0]) return 0

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (keys[mid][0] <= time) low = mid
    else high = mid - 1
  }

  return low
}

/** 키프레임 선형 보간으로 out [x, y, z, yaw] 를 채운다 */
export function keyPoseAt(keys: BoxKeyframe[], time: number, out: number[]) {
  const index = keyIndexAt(keys, time)

  const a = keys[index]

  const b = keys[Math.min(index + 1, keys.length - 1)]

  const span = b[0] - a[0]

  const k = span > 0 ? Math.min(Math.max((time - a[0]) / span, 0), 1) : 0

  for (let axis = 0; axis < 3; axis++) out[axis] = a[axis + 1] + (b[axis + 1] - a[axis + 1]) * k

  let delta = b[4] - a[4]

  if (delta > Math.PI) delta -= Math.PI * 2

  if (delta < -Math.PI) delta += Math.PI * 2

  out[3] = a[4] + delta * k

  return out
}

const quatB = new Quaternion()

/** 박스 자기 Y축 반 바퀴 (직사각형 박스의 대칭 짝) */
const HALF_TURN = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI)

/**
 * v2 기록 쿼터니언 보간 (world). 쿼터니언이 없는 키프레임이면 false
 * robot_IK 은 컨베이어에 놓은 박스를 반 바퀴 스냅해 컨베이어 방향(mod 360)에 맞추고, 1 Hz 키프레임엔 그 스냅이 한 칸으로 남는다.
 * 그대로 slerp 하면 놓은 뒤 1 초 동안 반 바퀴 돌아 보이므로, 그런 칸은 앞 키를 대칭 짝으로 바꿔 돌지 않게 한다.
 */
export function keyQuatAt(keys: BoxKeyframe[], time: number, out: Quaternion) {
  const index = keyIndexAt(keys, time)

  const a = keys[index]

  const b = keys[Math.min(index + 1, keys.length - 1)]

  if (a?.length !== 9 || b.length !== 9) return false

  const span = b[0] - a[0]

  const k = span > 0 ? Math.min(Math.max((time - a[0]) / span, 0), 1) : 0

  out.set(a[5], a[6], a[7], a[8]).normalize()

  if (k > 0) {
    quatB.set(b[5], b[6], b[7], b[8]).normalize()

    if (out.angleTo(quatB) > BOX_FLIP_SNAP) out.multiply(HALF_TURN)

    out.slerp(quatB, k)
  }

  return true
}

interface DriftState {
  key: number
  span: object
  offset: Vector3
}

/**
 * 강체 부모(팔·AMR·팔레트)로 계산한 박스 위치를 키프레임 경계마다 검사한다.
 * 5 cm 넘게 어긋나면 다음 경계까지 그 차이만큼 옮긴다. 부모가 바뀌면 초기화.
 */
export function createDriftResync() {
  const states = new Map<string, DriftState>()

  const pose = [0, 0, 0, 0]

  return function resync(id: string, keys: BoxKeyframe[] | undefined, time: number, span: object, matrix: Matrix4) {
    if (!keys?.length) return

    let state = states.get(id)

    if (!state || state.span !== span) {
      state = { key: -1, span, offset: new Vector3() }

      states.set(id, state)
    }

    const key = keyIndexAt(keys, time)

    const e = matrix.elements

    if (key !== state.key) {
      state.key = key

      keyPoseAt(keys, time, pose)

      state.offset.set(pose[0] - e[12], pose[1] - e[13], pose[2] - e[14])

      if (state.offset.length() <= DRIFT) state.offset.set(0, 0, 0)
    }

    e[12] += state.offset.x

    e[13] += state.offset.y

    e[14] += state.offset.z
  }
}
