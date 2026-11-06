import { Raycaster, Vector3, type Object3D } from 'three'

import type { ViewAngle } from '@/shared/stores/useMonitorViewStore'

import {
  ROBOT_DEFAULT_FOV,
  ROBOT_ELEVATION,
  ROBOT_FRAME_MARGIN,
  ROBOT_FRAME_RADIUS,
  ROBOT_FRONT_YAW_OFFSET,
  ROBOT_REACH_SNAP,
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

/** RobotArm.glb 원본(씬에 안 올라간 GLB 캐시) 초기 자세의 로봇 로컬 뻗음 방위각. 없으면 null */
let restReach: number | null = null

/** GlbCameraRig 가 원본 RobotArm.glb 를 한 번 넘긴다. 받침 원점 → 흡착점(없으면 hand04)의 수평 방향을 정면으로 잡는다 */
export function setRobotArmRest(arm: Object3D) {
  arm.updateWorldMatrix(true, true)

  const tip = arm.getObjectByName('RobotArm_point') ?? arm.getObjectByName('hand04')

  const reach = tip ? tip.getWorldPosition(new Vector3()).sub(arm.getWorldPosition(new Vector3())) : null

  if (!reach || Math.hypot(reach.x, reach.z) < 1e-3) {
    restReach = null

    return
  }

  const yaw = Math.atan2(reach.x, reach.z)

  const snapped = Math.round(yaw / QUARTER) * QUARTER

  restReach = Math.abs(yaw - snapped) < ROBOT_REACH_SNAP ? snapped : yaw
}

/** 디버그 · 검증용: 현재 쓰는 초기 뻗음 방위각 (rad) */
export const robotArmRestYaw = () => restReach

/** 로봇 로컬 기준 정면 방위각: 원본 초기 자세의 뻗음 방향. 원본을 못 읽으면 예전처럼 robot_cam 방향을 90° 스냅 */
function frontYaw(robotCam: CameraPose, reference: Object3D) {
  if (restReach !== null) return restReach + ROBOT_FRONT_YAW_OFFSET

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

const raycaster = new Raycaster()

const shown = (object: Object3D | null) => {
  for (let node = object; node; node = node.parent) if (!node.visible) return false

  return true
}

/** 로봇 중심 → 카메라 눈 사이에서 처음 막히는 거리 (자기 자신 제외). 안 막히면 Infinity */
function clearance(robot: Object3D, pose: CameraPose) {
  let root = robot

  while (root.parent) root = root.parent

  const direction = pose.position.clone().sub(pose.target)

  const length = direction.length()

  raycaster.set(pose.target, direction.normalize())

  raycaster.far = length

  for (const hit of raycaster.intersectObject(root, true)) {
    let own = false

    for (let node: Object3D | null = hit.object; node; node = node.parent) if (node === robot) own = true

    if (!own && shown(hit.object)) return hit.distance
  }

  return Infinity
}

/** 장비 상세 카메라: 정면 = 초기 팔이 뻗은 쪽에서 로봇을 마주봄, 측면 = 정면에서 ±90° (막히지 않는 쪽), 탑뷰 = 바로 위 */
export function robotCameraPose(robotCam: CameraPose, reference: Object3D, robot: Object3D, angle: ViewAngle): CameraPose {
  const center = robotCenter(robot).add(new Vector3(0, ROBOT_TARGET_HEIGHT, 0))

  const pose = (sideTurn: number) => framedCameraPose(center, yawOf(robot) + frontYaw(robotCam, reference), angle, robotCam.fov ?? ROBOT_DEFAULT_FOV, {
    radius: ROBOT_FRAME_RADIUS,
    margin: ROBOT_FRAME_MARGIN,
    elevation: ROBOT_ELEVATION,
    sideTurn,
    shiftRight: ROBOT_SHIFT_RIGHT,
    shiftUp: ROBOT_SHIFT_UP,
  })

  const primary = pose(ROBOT_SIDE_TURN)

  if (angle !== 'side') return primary

  // 기본 측면 시선이 벽 · 구조물에 막히면(창고 끝 로봇) 반대 측면. 둘 다 막히면 더 멀리 트인 쪽
  const first = clearance(robot, primary)

  if (first === Infinity) return primary

  const mirrored = pose(-ROBOT_SIDE_TURN)

  return clearance(robot, mirrored) > first ? mirrored : primary
}