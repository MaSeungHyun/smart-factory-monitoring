/** 스캔 검사 목표 / 목업 값 (재생 데이터에 없는 값) */

/** 재생 1회(약 200초) 기준 스캐너당 목표 검사 수 */
export const SCAN_TARGET = 8

/** 정상 판독률 목표 (%) */
export const PASS_TARGET = 99.5

/** 스캐너 온도 — 센서 데이터 없음 (목업) */
export const SCANNER_TEMP = { value: 38, limit: 60 }

/**
 * 불량률 차트 구간 수. 시안은 '최근 1시간 · 5분 단위' 지만 재생이 약 200초라
 * 재생 길이를 같은 개수로 나눠 씀 (200초 / 12 ≈ 17초 구간).
 */
export const DEFECT_BUCKETS = 12

/** 카메라 인셋에 보여 줄 최근 판독 수 */
export const INSET_RECENT = 6
