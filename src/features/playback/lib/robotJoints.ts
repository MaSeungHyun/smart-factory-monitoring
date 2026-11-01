import { Euler, Quaternion, Vector3, type Object3D } from 'three'

/*
 * robot_IK domain/robot/ik/joints.ts 의 createJointControl / setJointAngle 와 같은 규칙.
 * 기록된 각도(deg)는 Blender 기준 절대각이라, GLB 휴지 자세 각(initial)과의 차이만큼 축 회전한다.
 */
const X = new Vector3(1, 0, 0)

const Y = new Vector3(0, 1, 0)

const TO_GLTF = new Quaternion().setFromAxisAngle(X, -Math.PI / 2)

const TO_BLENDER = TO_GLTF.clone().invert()

const ROLL_JOINTS = new Set(['hand00', 'hand03'])

export interface JointControl {
  node: Object3D
  rest: Quaternion
  initial: number
  axis: Vector3
}

export function createJointControl(node: Object3D): JointControl {
  const rest = node.quaternion.clone()

  const rotation = new Euler().setFromQuaternion(TO_BLENDER.clone().multiply(rest).multiply(TO_GLTF), 'ZYX')

  const roll = ROLL_JOINTS.has(node.name)

  return { node, rest, initial: roll ? rotation.z : rotation.x, axis: roll ? Y : X }
}

const turn = new Quaternion()

export function setJointDegrees(control: JointControl, degrees: number) {
  turn.setFromAxisAngle(control.axis, (degrees * Math.PI) / 180 - control.initial)

  control.node.quaternion.copy(control.rest).multiply(turn)
}
