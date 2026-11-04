import { Box3, Vector3, type Object3D } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import {
  SCAN_DEFAULT_FOV,
  SCAN_ELEVATION,
  SCAN_FALLBACK_RADIUS,
  SCAN_FRAME_MARGIN,
  SCAN_FRONT_LOCAL_YAW,
  SCAN_FRONT_YAW_OFFSET,
  SCAN_LOOK_AHEAD,
  SCAN_MAX_RADIUS,
  SCAN_MIN_RADIUS,
  SCAN_SHIFT_RIGHT,
  SCAN_SHIFT_UP,
  SCAN_SIDE_TURN,
} from '../constants/scanCamera'
import { framedCameraPose } from './framedCameraPose'
import type { CameraPose } from './glbCameraPose'

const box = new Box3()

/** 월드 yaw: 부모 회전까지 포함한 스캐너 로컬 +z 의 수평 방위 */
function worldYaw(object: Object3D) {
  const axis = new Vector3(0, 0, 1).transformDirection(object.matrixWorld)

  return Math.atan2(axis.x, axis.z)
}

/** 스캐너 기준 정면(터널 입구) / 측면(90°) / 탑뷰(바로 위). 거리는 바운딩 박스 + 투입 벨트가 들어오게 */
export function scanCameraPose(scanner: Object3D, angle: ViewAngle, fov = SCAN_DEFAULT_FOV): CameraPose {
  scanner.updateWorldMatrix(true, true)

  box.setFromObject(scanner)

  const empty = box.isEmpty()

  const center = empty ? scanner.getWorldPosition(new Vector3()) : box.getCenter(new Vector3())

  const size = empty ? null : box.getSize(new Vector3())

  const frontYaw = worldYaw(scanner) + SCAN_FRONT_LOCAL_YAW + SCAN_FRONT_YAW_OFFSET

  // 입구 쪽 벨트를 같이 담도록 타깃을 정면 방향으로 당긴다
  center.add(new Vector3(Math.sin(frontYaw), 0, Math.cos(frontYaw)).multiplyScalar(SCAN_LOOK_AHEAD / 2))

  const radius = size ? Math.min(SCAN_MAX_RADIUS, Math.max(SCAN_MIN_RADIUS, size.length() / 2 + SCAN_LOOK_AHEAD / 2)) : SCAN_FALLBACK_RADIUS

  return framedCameraPose(center, frontYaw, angle, fov, {
    radius,
    margin: SCAN_FRAME_MARGIN,
    elevation: SCAN_ELEVATION,
    sideTurn: SCAN_SIDE_TURN,
    shiftRight: SCAN_SHIFT_RIGHT,
    shiftUp: SCAN_SHIFT_UP,
  })
}