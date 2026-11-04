import { Box3, Vector3, type Object3D } from 'three'

import type { CameraPose } from './glbCameraPose'

/** 장비 확대 거리 = 반경 x 이 배율 (클수록 멀리) */
const FOCUS_DISTANCE_SCALE = 3.8

/** 장비 확대 최소 거리 (m): 작은 장비도 이보다 가까이 붙지 않는다 */
const FOCUS_MIN_DISTANCE = 8.5

const box = new Box3()

const size = new Vector3()

/** 장비를 화면에 담는 시점: 지금 보는 방향 유지, 크기에 맞춰 거리, 너무 낮으면 위로 */
export function focusPose(object: Object3D, from: Vector3, target: Vector3): CameraPose {
  box.setFromObject(object)

  const center = box.getCenter(new Vector3())

  const radius = Math.max(box.getSize(size).length() / 2, 1.5)

  const direction = from.clone().sub(target).normalize()

  if (direction.y < 0.45) {
    direction.y = 0.45

    direction.normalize()
  }

  return { position: center.clone().addScaledVector(direction, Math.max(radius * FOCUS_DISTANCE_SCALE, FOCUS_MIN_DISTANCE)), target: center }
}

/** 타깃 기준 거리만 factor 배 */
export function zoomPose(from: Vector3, target: Vector3, factor: number): CameraPose {
  const offset = from.clone().sub(target).multiplyScalar(factor)

  if (offset.length() < 2) offset.setLength(2)

  return { position: target.clone().add(offset), target: target.clone() }
}