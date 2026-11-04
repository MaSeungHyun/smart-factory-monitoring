import { Vector3 } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import type { CameraPose } from './glbCameraPose'

const UP = new Vector3(0, 1, 0)

/** 탑뷰가 완전 수직이면 OrbitControls 가 뒤집혀서 아주 조금 남겨 둔다 (rad) */
const TOP_EPSILON = 0.001

export interface FrameOptions {
  /** 프레임에 담을 반경 (m) */
  radius: number
  /** 화면 여유 배율 */
  margin: number
  /** 정면·측면 올려 보는 각도 (rad) */
  elevation: number
  /** 측면 = 정면에서 돌리는 각도 (rad) */
  sideTurn: number
  /** 화면 오른쪽 / 위로 미는 양 (반경 대비 비율) */
  shiftRight: number
  shiftUp: number
}

/**
 * 정면 방위(frontYaw: 장비 → 카메라 방향, 월드 yaw)를 기준으로 정면 / 측면(+sideTurn) / 탑뷰(바로 위) 카메라.
 * 거리는 화각으로 반경이 다 들어오게 잡고, 타깃을 왼쪽·아래로 옮겨 장비가 오버레이를 피해 화면 오른쪽 위에 오게 한다.
 */
export function framedCameraPose(center: Vector3, frontYaw: number, angle: ViewAngle, fov: number, options: FrameOptions): CameraPose {
  const distance = (options.radius * options.margin) / Math.sin((fov * Math.PI) / 360)

  const yaw = frontYaw + (angle === 'side' ? options.sideTurn : 0)

  const facing = new Vector3(Math.sin(yaw), 0, Math.cos(yaw))

  const elevation = angle === 'top' ? Math.PI / 2 - TOP_EPSILON : options.elevation

  const offset = facing.multiplyScalar(Math.cos(elevation)).addScaledVector(UP, Math.sin(elevation)).multiplyScalar(distance)

  const forward = offset.clone().negate().normalize()

  const right = new Vector3().crossVectors(forward, UP).normalize()

  const screenUp = new Vector3().crossVectors(right, forward).normalize()

  const shift = right.multiplyScalar(-options.shiftRight * options.radius).addScaledVector(screenUp, -options.shiftUp * options.radius)

  const target = center.clone().add(shift)

  return { position: target.clone().add(offset), target, fov }
}