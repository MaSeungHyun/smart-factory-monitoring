export const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 최단 방향 각도 보간 (rad) */
export function lerpAngle(a: number, b: number, k: number) {
  let delta = (b - a) % (Math.PI * 2)

  if (delta > Math.PI) delta -= Math.PI * 2

  if (delta < -Math.PI) delta += Math.PI * 2

  return a + delta * k
}
