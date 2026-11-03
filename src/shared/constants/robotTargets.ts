/**
 * 로봇별 개인 목표 처리량 (개, 하루 누적 사이클 기준).
 * 기본 run(v3) 종료 시점 누적 처리량의 80~95% 근처가 되도록 로봇마다 다르게 잡은 고정값.
 */
export const ROBOT_TARGETS: Record<string, number> = {
  /** 로봇 1 · 5 · 6: 기본 run 에서는 처리 기록 없음 (기본값과 같은 목표) */
  'robot-1': 150,
  'robot-5': 150,
  'robot-6': 150,
  /** 로봇 7: 처리량이 가장 많은 라인 (run 종료 160개) */
  'robot-7': 180,
  /** 로봇 8: run 종료 148개 */
  'robot-8': 170,
  /** 로봇 9: run 종료 144개 */
  'robot-9': 175,
  /** 로봇 67: run 종료 152개 */
  'robot-67': 160,
  /** 로봇 68: run 종료 140개 */
  'robot-68': 165,
  /** 로봇 69: run 종료 136개 */
  'robot-69': 170,
}

/** 목록에 없는 로봇의 기본 목표 처리량 (개) */
export const DEFAULT_ROBOT_TARGET = 150

/** 로봇의 개인 목표 처리량 */
export function robotTarget(id: string) {
  return ROBOT_TARGETS[id] ?? DEFAULT_ROBOT_TARGET
}

/** 처리량 / 개인 목표 → 0~100 % */
export function robotPercent(id: string, count: number) {
  return Math.max(0, Math.min(100, Math.round((count / robotTarget(id)) * 100)))
}
