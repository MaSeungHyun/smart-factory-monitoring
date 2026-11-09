import {
  allocateRobotShares,
  FACTORY_DAY_TARGET,
  LOW_LOAD_DAY_TARGET,
  LOW_LOAD_ROBOTS,
  ROBOT_WEIGHTS,
} from '@/features/playback/lib/shiftBaseline'

/**
 * 로봇별 개인 목표 = 공장 일일 목표(10800)를 로봇 비중으로 나눈 값.
 * 저부하(1·5·6)는 동일 저목표.
 */
export const ROBOT_TARGETS: Record<string, number> = {
  ...allocateRobotShares(FACTORY_DAY_TARGET, ROBOT_WEIGHTS, LOW_LOAD_DAY_TARGET),
}

/** 목록에 없는 로봇의 기본 목표 처리량 (개) */
export const DEFAULT_ROBOT_TARGET = Math.round(
  (FACTORY_DAY_TARGET - LOW_LOAD_DAY_TARGET * LOW_LOAD_ROBOTS.length) / 6,
)

/** 로봇의 개인 목표 처리량 */
export function robotTarget(id: string) {
  return ROBOT_TARGETS[id] ?? DEFAULT_ROBOT_TARGET
}

/** 처리량 / 개인 목표 → 0~100 % */
export function robotPercent(id: string, count: number) {
  return Math.max(0, Math.min(100, Math.round((count / robotTarget(id)) * 100)))
}
