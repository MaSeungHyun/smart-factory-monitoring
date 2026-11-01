import type { DecodedBox } from './decodeBoxes'

export interface InboundPoint {
  src: string
  x: number
  y: number
  z: number
  /** 이 지점 입고 시각들 (오름차순) */
  spawns: number[]
}

/** 입고 컨베이어별 첫 등장 위치 + 입고 시각 */
export function inboundPoints(boxes: DecodedBox[]): InboundPoint[] {
  const points = new Map<string, InboundPoint>()

  for (const box of boxes) {
    const src = box.src ?? 'unknown'

    const point = points.get(src) ?? { src, x: box.poses[0], y: box.poses[1], z: box.poses[2], spawns: [] }

    point.spawns.push(box.start)

    points.set(src, point)
  }

  return [...points.values()].map((point) => ({ ...point, spawns: point.spawns.sort((a, b) => a - b) }))
}
