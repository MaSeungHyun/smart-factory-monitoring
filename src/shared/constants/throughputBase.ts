/**
 * 시연용 오늘 처리량 베이스 (팔레트).
 *
 * 기본 녹화를 5:30 지점에서 시작하면 공정 흐름 입고는 1,200 인데 오늘 처리량(출고 누적)은 114 라서,
 * 시작 시점에 두 값이 같아 보이도록 차이(1,200 - 114 = 1,086)를 오늘 처리량에만 더한다.
 * 출고 카드 · KPI 출고 값에는 더하지 않는다.
 *
 * 없애려면 THROUGHPUT_BASE 를 0 으로 두거나, 이 파일과 withThroughputBase 호출(dashboardView · TodayPanel)을 지운다.
 */

/** 오늘 처리량에 더하는 베이스 (팔레트) */
export const THROUGHPUT_BASE = 1086

/** 출고 누적 -> 화면에 보일 오늘 처리량 */
export const withThroughputBase = (value: number) => value + THROUGHPUT_BASE
