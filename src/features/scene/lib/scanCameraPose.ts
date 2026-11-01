import { Vector3, type Object3D } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import type { CameraPose } from './glbCameraPose'

/** factory.glb 에 스캔 전용 카메라가 없어 스캐너 터널 + 투입 벨트를 직접 프레이밍 */
const LOOK_AHEAD = 3

const TARGET_HEIGHT = 1.2

const OFFSET: Record<ViewAngle, Vector3> = {
  front: new Vector3(8, 7, 15),
  side: new Vector3(15, 6.5, 0.01),
  top: new Vector3(0, 20, 0.01),
}

const DEFAULT_FOV = 45

/** 스캐너 기준 정면 / 측면 / 탑뷰 카메라 (벨트는 +z 쪽에서 터널로 들어옴) */
export function scanCameraPose(scanner: Object3D, angle: ViewAngle, fov = DEFAULT_FOV): CameraPose {
  const center = scanner.getWorldPosition(new Vector3())

  const target = new Vector3(center.x, TARGET_HEIGHT, center.z + LOOK_AHEAD)

  return { position: target.clone().add(OFFSET[angle]), target, fov }
}
