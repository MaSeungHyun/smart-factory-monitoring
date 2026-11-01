import type { Object3D } from 'three'

/** robot_IK findGripPoint 과 같은 이름 규칙 */
const GRIP_NAME = /^(robotarm_point|grippoint)$/i

const cache = new WeakMap<Object3D, Object3D | null>()

/** 로봇 그룹 안의 그리퍼 끝점 노드 (없으면 마지막 관절 hand04) */
export function findGripPoint(robot: Object3D): Object3D | null {
  if (cache.has(robot)) return cache.get(robot) ?? null

  let found: Object3D | null = null

  robot.traverse((node) => {
    if (!found && GRIP_NAME.test(node.name)) found = node
  })

  const point = found ?? robot.getObjectByName('hand04') ?? null

  cache.set(robot, point)

  return point
}
