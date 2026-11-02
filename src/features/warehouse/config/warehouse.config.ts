/**
 * 창고 · AMR 화면 설정.
 * MOCK_ 로 시작하는 값은 재생 데이터(robot_IK 기록)에 없는 항목이라 화면 구성용 목업 (UI 에 '목업' 표시).
 */

/** 배터리 경고 기준 % */
export const LOW_BATTERY = 30

/** 속도 계산 구간 (포즈 프레임 수, 10Hz → 0.5s) */
export const SPEED_WINDOW = 5

/** 입고 목표 (박스, 재생 1회 200s 기준) */
export const INBOUND_TARGET = 150

/** 출고 대기 팔레트 한도 */
export const OUTBOUND_WAIT_LIMIT = 20

/** robot_IK 상태 문구 → 경로 문구 (위에서부터 첫 매칭) */
export const ROUTE_TEXT: Array<[RegExp, string]> = [
  [/입하 팔레트 하역 위치로 운반/, '팔레트 이송 → 하역 위치'],
  [/입하 컨베이어에서 팔레트 받는/, '입하 컨베이어 → 팔레트 수령'],
  [/대기 위치로 복귀/, '복귀 → 대기 위치'],
  [/인계 지점 팔레트로 이동/, '이동 → 인계 지점 팔레트'],
  [/랙으로 이동|랙 앞 정렬|포크 상승/, '팔레트 이송 → 랙 {rack}'],
  [/랙에서 후진/, '랙 {rack} 적재 완료 · 후진'],
  [/포크 삽입|팔레트 들어올림|팔레트 들고 후진|팔레트 앞 정렬/, '팔레트 픽업 중'],
  [/출고 완료 처리/, '출고 완료 처리'],
  [/완성 팔레트 대기/, '완성 팔레트 · 출고 대기'],
  [/팔레트 적재 중 \(로봇 적재 대기\)\]\s*(.*)/, '로봇 적재 대기 · $1'],
  [/팔레트를 든 채 로봇 적재 대기/, '팔레트 보유 · 로봇 적재 대기'],
  [/지게차 대기|작업 대기|^\[대기\]$/, '작업 대기'],
]

/** 이동형 랙 적재 목업 */
export const MOCK_MOBILE_RACK = { used: 3, slots: 4 }

export type DockState = 'busy' | 'free'

/** 출고 도크 목업 — 재생 기록에 출고 도크 이벤트 없음 */
export const MOCK_DOCKS: Array<{ id: string; name: string; state: DockState; note: string }> = [
  { id: 'd1', name: '도크 1', state: 'busy', note: '트럭 적재 중' },
  { id: 'd2', name: '도크 2', state: 'busy', note: '출차 대기' },
  { id: 'd3', name: '도크 3', state: 'free', note: '배정 대기' },
]

/** 도크 안내 목업 */
export const MOCK_DOCK_NOTICE = [
  '도크 만석 → 지게차가 팔레트를 이동형 랙 상단에 적재',
  '도크 비움 → AGV 바로 출고 배정',
]

export const DOCK_RULE = '출고 분기: 도크 여유 시 바로 출고 · 만석 시 이동형 랙 경유'

/** 주문 목업 — 재생 데이터에 주문 없음 */
export const MOCK_ORDERS = { waiting: 42, progress: 18, done: 356, total: 416, target: 400 }
