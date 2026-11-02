import { Matrix4, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'

import { findGripPoint } from '@/shared/lib/three/findGripPoint'

import { boxPoseAt } from './boxPoseAt'
import type { DecodedBox, DecodedGrip } from './decodeBoxes'

/** 놓을 때 그리퍼와 기록 위치 사이를 섞는 시간 s */
const BLEND = 0.35

/** 기록은 손이 닿기 몇 초 전에 박스를 들어 올린다. 그 구간은 자리에 둔다 */
const APPROACH = 4.5

/** 그리퍼 끝과 박스 윗면이 이 거리 안이면 닿은 것으로 본다 */
const CONTACT = 0.2

/** 끝점이 끝내 박스에 안 닿아도, 잡기 시각 이후 이 시간이 지나면 붙인다 */
const CONTACT_LATE = 1

/** 닿은 뒤 그리퍼에 붙는 시간 s */
const CATCH = 0.15

const UP = new Vector3(0, 1, 0)

/** free = 기록 포즈, rest = 닿기 전 제자리, attach = 그리퍼, omit = 팔레트 계산에서 제외 */
export type BoxPlace = 'free' | 'rest' | 'attach' | 'omit'

interface Held {
  grip: DecodedGrip
  matrix: Matrix4
}

const gripWorld = new Matrix4()

const gripPos = new Vector3()

const gripRot = new Quaternion()

const UNIT = new Vector3(1, 1, 1)

const held = new Matrix4()

const posA = new Vector3()

const posB = new Vector3()

const rotA = new Quaternion()

const rotB = new Quaternion()

const scaleA = new Vector3()

const scaleB = new Vector3()

const restMat = new Matrix4()

const restRot = new Quaternion()

const restPos = new Vector3()

const sample = [0, 0, 0, 0]

interface Settle {
  x: number
  y: number
  z: number
  yaw: number
}

const settles = new WeakMap<DecodedGrip, Settle>()

/** 그리퍼가 박스에 닿은 시각. 두 컴포넌트가 같은 판정을 쓰도록 모듈에 둔다 */
const contacts = new WeakMap<DecodedGrip, number>()

function blend(from: Matrix4, to: Matrix4, weight: number, out: Matrix4) {
  from.decompose(posA, rotA, scaleA)

  to.decompose(posB, rotB, scaleB)

  posA.lerp(posB, weight)

  rotA.slerp(rotB, weight)

  return out.compose(posA, rotA, scaleA)
}

const smooth = (value: number) => {
  const x = Math.min(Math.max(value, 0), 1)

  return x * x * (3 - 2 * x)
}

/**
 * 박스 윗면 중심을 그리퍼 끝점에 붙이고, 잡는 순간의 상대 회전은 유지한다.
 * 각만 기록 값으로 바꾸면 박스가 흡착점에서 빠져나간다.
 */
function gripMatrix(grip: DecodedGrip, recorded: Matrix4, offsets: Map<DecodedGrip, Quaternion>) {
  let offset = offsets.get(grip)

  if (!offset) {
    recorded.decompose(posA, rotA, scaleA)

    offset = gripRot.clone().invert().multiply(rotA)

    offsets.set(grip, offset)
  }

  return held.compose(gripPos, rotB.copy(gripRot).multiply(offset), UNIT)
}

function settleOf(box: DecodedBox, grip: DecodedGrip) {
  const cached = settles.get(grip)

  if (cached) return cached

  boxPoseAt(box, grip.start, sample)

  const anchorX = sample[0]

  const anchorZ = sample[2]

  let best: Settle = { x: sample[0], y: sample[1], z: sample[2], yaw: sample[3] }

  for (let time = grip.start - APPROACH; time <= grip.start; time += 0.1) {
    boxPoseAt(box, time, sample)

    if (Math.hypot(sample[0] - anchorX, sample[2] - anchorZ) > 0.45) continue

    if (sample[1] >= best.y - 0.005) continue

    best = { x: sample[0], y: sample[1], z: sample[2], yaw: sample[3] }
  }

  settles.set(grip, best)

  return best
}

function writeRest(settle: Settle, out: Matrix4) {
  restPos.set(settle.x, settle.y, settle.z)

  restRot.setFromAxisAngle(UP, settle.yaw)

  return out.compose(restPos, restRot, UNIT)
}

/** 로봇이 든 박스를 실제 그리퍼 노드에 붙인다. 기록 경로는 손이 닿기 전과 놓은 뒤에만 쓴다 */
export function createGripSync(scene: Object3D) {
  const offsets = new Map<DecodedGrip, Quaternion>()

  const lastHeld = new Map<DecodedBox, Held>()

  function gripPoint(grip: DecodedGrip) {
    const robot = scene.getObjectByName(grip.robot)

    const point = robot ? findGripPoint(robot) : null

    if (!point) return false

    point.updateWorldMatrix(true, false)

    gripWorld.copy(point.matrixWorld)

    gripWorld.decompose(gripPos, gripRot, scaleB)

    return true
  }

  function touched(grip: DecodedGrip, settle: Settle, time: number) {
    if (contacts.has(grip)) return true

    if (!gripPoint(grip)) return false

    const distance = Math.hypot(gripPos.x - settle.x, gripPos.y - settle.y, gripPos.z - settle.z)

    const late = time >= grip.start + CONTACT_LATE

    if (distance > CONTACT && !late) return false

    contacts.set(grip, time)

    return true
  }

  /**
   * 기록 포즈는 손과 따로라, 들림이 손보다 먼저 나온다.
   * 그리퍼가 놓여 있던 자리에 닿기 전에는 그 자세를 pose 에 덮어쓴다.
   */
  function place(box: DecodedBox, time: number, pose: number[]): BoxPlace {
    for (const grip of box.grips) {
      if (grip.synthetic) {
        if (time >= grip.start - 0.5 && time < grip.end) return 'omit'

        continue
      }

      if (time < grip.start - APPROACH || time >= grip.end) continue

      const settle = settleOf(box, grip)

      if (!touched(grip, settle, time)) {
        pose[0] = settle.x

        pose[1] = settle.y

        pose[2] = settle.z

        pose[3] = settle.yaw

        return 'rest'
      }

      return 'attach'
    }

    return 'free'
  }

  function carry(box: DecodedBox, grip: DecodedGrip, recorded: Matrix4, time: number) {
    if (!gripPoint(grip)) return

    const settle = settleOf(box, grip)

    const base = writeRest(settle, restMat)

    const attached = gripMatrix(grip, base, offsets)

    const entry = lastHeld.get(box)

    if (entry?.grip === grip) entry.matrix.copy(attached)
    else lastHeld.set(box, { grip, matrix: attached.clone() })

    const at = contacts.get(grip) ?? time

    blend(base, attached, smooth((time - at) / CATCH), recorded)
  }

  function release(box: DecodedBox, grip: DecodedGrip, recorded: Matrix4, time: number) {
    const entry = lastHeld.get(box)

    if (entry?.grip === grip) blend(entry.matrix, recorded, smooth((time - grip.end) / BLEND), recorded)
  }

  /** recorded 를 그리퍼 동기화 결과로 바꾼다. 로봇이 들고 있으면 true */
  function apply(box: DecodedBox, time: number, recorded: Matrix4) {
    for (const grip of box.grips) {
      if (grip.synthetic) continue

      if (time >= grip.start - APPROACH && time < grip.end) {
        if (!contacts.has(grip)) return false

        carry(box, grip, recorded, time)

        return true
      }

      if (time >= grip.end && time < grip.end + BLEND) {
        release(box, grip, recorded, time)

        return false
      }
    }

    return false
  }

  return { apply, place }
}
