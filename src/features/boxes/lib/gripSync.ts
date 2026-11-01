import { Matrix4, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'

import { findGripPoint } from '@/shared/lib/three/findGripPoint'

import type { DecodedBox, DecodedGrip } from './decodeBoxes'


/** 잡을 때 / 놓을 때 기록 위치와 그리퍼 위치 사이를 섞는 시간 s */
const BLEND = 0.35

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

/** 로봇이 든 박스를 실제 그리퍼 노드에 붙인다 (기록 위치는 잡기 직전 / 놓은 직후만 사용) */
export function createGripSync(scene: Object3D) {
  const offsets = new Map<DecodedGrip, Quaternion>()

  const lastHeld = new Map<DecodedBox, Held>()

  function gripMatrix(grip: DecodedGrip, recorded: Matrix4) {
    const robot = scene.getObjectByName(grip.robot)

    const point = robot ? findGripPoint(robot) : null

    if (!point) return null

    point.updateWorldMatrix(true, false)

    gripWorld.copy(point.matrixWorld)

    gripWorld.decompose(gripPos, gripRot, scaleB)

    let offset = offsets.get(grip)

    if (!offset) {
      // 박스 원점(윗면 중앙)을 그리퍼 끝점에 그대로 붙이고, 잡는 순간의 상대 회전만 유지
      recorded.decompose(posA, rotA, scaleA)

      offset = gripRot.clone().invert().multiply(rotA)

      offsets.set(grip, offset)
    }

    return held.compose(gripPos, rotB.copy(gripRot).multiply(offset), UNIT)
  }

  /** recorded 를 그리퍼 동기화 결과로 바꾼다. 로봇이 들고 있으면 true */
  return function apply(box: DecodedBox, time: number, recorded: Matrix4) {
    for (const grip of box.grips) {
      if (time >= grip.start && time < grip.end) {
        const attached = gripMatrix(grip, recorded)

        if (!attached) return true

        const entry = lastHeld.get(box)

        if (entry && entry.grip === grip) entry.matrix.copy(attached)
        else lastHeld.set(box, { grip, matrix: attached.clone() })

        const weight = smooth((time - grip.start) / BLEND)


        blend(recorded, attached, weight, recorded)

        return true
      }

      if (time >= grip.end && time < grip.end + BLEND) {
        const entry = lastHeld.get(box)

        if (entry && entry.grip === grip) blend(entry.matrix, recorded, smooth((time - grip.end) / BLEND), recorded)

        return false
      }
    }

    return false
  }
}
