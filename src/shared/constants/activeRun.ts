/**
 * 재생 녹화와 공장 배치 (한 곳에서 고른다).
 * - url: 녹화 manifest (public/data 아래)
 * - layout: 공장 배치 템플릿. 'v2' = robot_IK 템플릿 06, 'v2-optimized' = 템플릿 10 (features/template/data/templates.ts)
 * - realHistory: 녹화가 t=0 부터의 실제 시뮬 이력(aggregates.perMinute 전 구간, KPI 하루 누계)을 담으면 true.
 *   true 면 시연용 가상 5시간 누계(VIRTUAL_COUNTS_AT_START) 보정을 끄고 녹화 값을 그대로 보여 준다.
 *
 * 다른 녹화로 바꾸려면 아래 ACTIVE_RUN 만 고친다.
 */
export interface ActiveRunConfig {
  url: string
  layout: 'v2' | 'v2-optimized'
  realHistory: boolean
}

/** 템플릿 06, 시뮬 2:00:00 ~ 2:20:00 (워밍업 7200s, 녹화 1200s, seed 12345), 가상 5시간 누계 보정 */
export const ACTIVE_RUN: ActiveRunConfig = {
  url: '/data/run-2026-11-03-t06-20m-w7200-s12345-v3/manifest.json',
  layout: 'v2',
  realHistory: false,
}
