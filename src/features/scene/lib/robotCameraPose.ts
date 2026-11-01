import { Vector3, type Object3D } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import type { CameraPose } from './glbCameraPose'

const UP = new Vector3(0, 1, 0)

const TOP_HEIGHT = 16

const ANGLE_TURN: Record<Exclude<ViewAngle, 'top'>, number> = { front: 0, side: Math.PI / 2 }

const yawOf = (object: Object3D) => object.rotation.y

/**
 * robot_cam 은 기준 로봇(robot-1)을 비춘다. 그 로봇 기준 상대 오프셋을 선택 로봇의 위치/yaw 로 옮겨
 * 로봇마다 같은 구도로 카메라를 이동. 측면 = 로봇 중심으로 90° 회전, 탑뷰 = 바로 위에서 내려다봄.
 */
export function robotCameraPose(robotCam: CameraPose, reference: Object3D, robot: Object3D, angle: ViewAngle): CameraPose {
  const base = reference.getWorldPosition(new Vector3())

  const center = robot.getWorldPosition(new Vector3())

  if (angle === 'top') {
    return {
      position: center.clone().add(new Vector3(0, TOP_HEIGHT, 0.01)),
      target: center.clone().setY(0),
      fov: robotCam.fov,
    }
  }

  const turn = yawOf(robot) - yawOf(reference) + ANGLE_TURN[angle]

  const move = (point: Vector3) => point.clone().sub(base).applyAxisAngle(UP, turn).add(center)

  return { position: move(robotCam.position), target: move(robotCam.target), fov: robotCam.fov }
}
