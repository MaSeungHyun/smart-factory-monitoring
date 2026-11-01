import { boxPoseAt } from './boxPoseAt'
import type { DecodedBox } from './decodeBoxes'

export type WorkSpot = [number, number, number]

/** 같은 작업 지점으로 묶는 수평 거리 (m) */
const CLUSTER_RADIUS = 1.2

interface Cluster {
  x: number
  z: number
  minY: number
  count: number
  real: number
}

/**
 * 로봇별 작업 지점: 잡는 순간 박스 위치를 지점별로 묶고, 가장 많이 집은 지점의 평균 (m).
 * y 는 그 지점 박스 윗면 최저값 (= 컨베이어 위 한 단). 기록된 집기를 합성 집기보다 우선한다.
 */
export function robotWorkSpots(boxes: DecodedBox[]) {
  const clusters = new Map<string, Cluster[]>()

  const pose = [0, 0, 0, 0]

  for (const box of boxes) {
    for (const grip of box.grips) {
      boxPoseAt(box, grip.start, pose)

      const list = clusters.get(grip.robot) ?? []

      const near = list.find((cluster) => Math.hypot(cluster.x - pose[0], cluster.z - pose[2]) <= CLUSTER_RADIUS)

      if (near) {
        near.x = (near.x * near.count + pose[0]) / (near.count + 1)

        near.z = (near.z * near.count + pose[2]) / (near.count + 1)

        near.minY = Math.min(near.minY, pose[1])

        near.count += 1

        near.real += grip.synthetic ? 0 : 1
      } else {
        list.push({ x: pose[0], z: pose[2], minY: pose[1], count: 1, real: grip.synthetic ? 0 : 1 })
      }

      clusters.set(grip.robot, list)
    }
  }

  const spots = new Map<string, WorkSpot>()

  for (const [robot, list] of clusters) {
    const best = list.reduce((top, cluster) => (cluster.real > top.real || (cluster.real === top.real && cluster.count > top.count) ? cluster : top))

    spots.set(robot, [best.x, best.minY, best.z])
  }

  return spots
}
