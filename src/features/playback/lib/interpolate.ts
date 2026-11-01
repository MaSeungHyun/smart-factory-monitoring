export const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 네 점을 지나는 곡선. 10Hz 샘플의 꺾임을 둥글린다 */
export function catmull(p0: number, p1: number, p2: number, p3: number, k: number) {
  const k2 = k * k

  const k3 = k2 * k

  return 0.5 * (2 * p1 + (-p0 + p2) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k2 + (-p0 + 3 * p1 - 3 * p2 + p3) * k3)
}

/** 최단 방향 각도 보간 (rad) */
export function lerpAngle(a: number, b: number, k: number) {
  let delta = (b - a) % (Math.PI * 2)

  if (delta > Math.PI) delta -= Math.PI * 2

  if (delta < -Math.PI) delta += Math.PI * 2

  return a + delta * k
}
