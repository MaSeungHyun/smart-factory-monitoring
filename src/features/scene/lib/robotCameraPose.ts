import { Vector3, type Object3D } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import {
  ROBOT_DEFAULT_FOV,
  ROBOT_ELEVATION,
  ROBOT_FRAME_MARGIN,
  ROBOT_FRAME_RADIUS,
  ROBOT_FRONT_YAW_OFFSET,
  ROBOT_SHIFT_RIGHT,
  ROBOT_SHIFT_UP,
  ROBOT_SIDE_TURN,
  ROBOT_TARGET_HEIGHT,
} from '../constants/robotCamera'
import { robotBaseSpot } from './boundsRaycast'
import { framedCameraPose } from './framedCameraPose'
import type { CameraPose } from './glbCameraPose'

const QUARTER = Math.PI / 2

const yawOf = (object: Object3D) => object.rotation.y

/** 로봇 로컬 기준 정면 방위각: 원본 robot_cam 이 기준 로봇을 보는 방향을 90° 단위로 스냅 (대각 45° 구도 제거) */
function frontYaw(robotCam: CameraPose, reference: Object3D) {
  const from = robotCam.position.clone().sub(reference.getWorldPosition(new Vector3()))

  const local = Math.atan2(from.x, from.z) - yawOf(reference)

  return Math.round(local / QUARTER) * QUARTER + ROBOT_FRONT_YAW_OFFSET
}

/** 로봇 중심(base 메쉬) 기준점. base 가 없으면 원점 */
function robotCenter(robot: Object3D) {
  const out = new Vector3()

  if (!robotBaseSpot(robot, out)) robot.getWorldPosition(out)

  return out
}

/** 장비 상세 카메라: 정면 = 로봇 정면을 마주봄, 측면 = 정면에서 90°, 탑뷰 = 바로 위 */
export function robotCameraPose(robotCam: CameraPose, reference: Object3D, robot: Object3D, angle: ViewAngle): CameraPose {
  const center = robotCenter(robot).add(new Vector3(0, ROBOT_TARGET_HEIGHT, 0))

  return framedCameraPose(center, yawOf(robot) + frontYaw(robotCam, reference), angle, robotCam.fov ?? ROBOT_DEFAULT_FOV, {
    radius: ROBOT_FRAME_RADIUS,
    margin: ROBOT_FRAME_MARGIN,
    elevation: ROBOT_ELEVATION,
    sideTurn: ROBOT_SIDE_TURN,
    shiftRight: ROBOT_SHIFT_RIGHT,
    shiftUp: ROBOT_SHIFT_UP,
  })
}