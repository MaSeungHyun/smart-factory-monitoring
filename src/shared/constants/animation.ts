/** 숫자 · 진행 막대 스무딩 애니메이션 (지수 스무딩: value += (target - value) * (1 - e^(-dt / τ))) */

/** 첫 마운트 때 0 → 값으로 차오르는 시정수 τ (ms). 약 3τ(≈1초) 뒤 95% 도달, 끝으로 갈수록 감속 */
export const SMOOTH_MOUNT_TAU_MS = 330

/** 이후 값이 바뀔 때 새 목표를 따라가는 시정수 τ (ms). 다시 시작하지 않고 현재 값에서 이어진다 */
export const SMOOTH_UPDATE_TAU_MS = 250

/** 목표와 이 비율(값 범위 대비)보다 가까우면 목표에 붙이고 프레임 루프를 멈춘다 */
export const SMOOTH_SETTLE_EPSILON = 0.001

/** 탭 전환 등으로 프레임이 길게 끊겼을 때 한 번에 반영할 최대 시간 (ms) */
export const SMOOTH_MAX_FRAME_MS = 100
/** 패널 · 카드 마운트 애니메이션 (Motion). 실시간 값에는 쓰지 않는다. 시각은 대시보드가 나타난 순간(T=0) 기준 */

/** 오늘 현황 · 공정 흐름 · 오른쪽 패널: 들어오는 거리 (px) · 시간 (초) */
export const SIDE_PANEL_ENTER_OFFSET_PX = 60
export const SIDE_PANEL_ENTER_DURATION_S = 0.7

/** 오늘 현황(왼쪽) · 공정 흐름(아래)이 출발하기까지 기다리는 시간 (초). 오른쪽 패널은 바로 */
export const SIDE_PANEL_ENTER_DELAY_S = 0.1

/** 떠 있는 작은 컨트롤(범례 · 재생 · 지도 도구): 가까운 가장자리에서 살짝 밀려오는 거리 (px) · 시작 (초) · 시간 (초) */
export const FLOAT_ENTER_OFFSET_PX = 12
export const FLOAT_ENTER_DELAY_S = 0.2
export const FLOAT_ENTER_DURATION_S = 0.6

/** 탭 전환 때 이전 화면 패널이 사라지는 시간 (초) */
export const PANEL_EXIT_DURATION_S = 0.15

/** 사라질 때 움직이는 거리 (px). 짧게 살짝만 */
export const PANEL_EXIT_OFFSET_PX = 12

/** 카드 하나가 들어오는 시간 (초) */
export const CARD_ENTER_DURATION_S = 0.5

/** 카드가 출발하는 거리 (px, 아래에서 위로) */
export const CARD_ENTER_OFFSET_PX = 20

/** 카드 목록에서 다음 카드가 늦게 출발하는 간격 (초, 왼쪽 → 오른쪽) */
export const CARD_STAGGER_S = 0.06

/** 첫 카드가 출발하는 시각 (초, 패널 애니메이션 시작 기준. 패널 자체 지연은 더해지지 않음) */
export const CARD_STAGGER_DELAY_S = 0.4

/** 감속 곡선 (ease-out, 오버슈트 없음) */
export const PANEL_EASE = [0.22, 1, 0.36, 1] as const

/** 탭 전환 (인트로가 끝난 뒤의 마운트): 패널이 들어오는 시간 (초) */
export const TAB_ENTER_DURATION_S = 0.4

/** 탭 전환: 마운트 직후 커밋 · 레이아웃 · 캔버스 리사이즈가 끝나도록 잠깐 기다린 뒤 출발 (초). 첫 프레임이 끊겨 보이지 않게 */
export const TAB_ENTER_DELAY_S = 0.06

/** 탭 전환: 패널이 출발하는 거리 (px). 인트로보다 짧게 */
export const TAB_ENTER_OFFSET_PX = 24

/** 탭 전환: 첫 카드가 출발하는 시각 (초, 패널 출발 기준) */
export const TAB_CARD_STAGGER_DELAY_S = 0.12

/** 이 시각(초, 인트로 T=0 기준) 이후 마운트는 탭 전환으로 본다 */
export const INTRO_WINDOW_S = 2

/** 인트로: 모든 준비(로딩 화면 사라짐 · 씬 안정 프레임 · 재생 데이터)가 끝난 뒤 T=0 까지 두는 짧은 틈 (초) */
export const INTRO_START_DELAY_S = 0.2

/** 인트로: 씬이 준비된 뒤 T=0 전에 기다리는 안정 프레임 수 (첫 프레임 끊김 방지) */
export const INTRO_STABLE_FRAMES = 3

/** 인트로: 씬 위 어두운 막이 1 → 0 으로 걷히는 시간 (초) */
export const INTRO_FADE_DURATION_S = 1.0

/** 인트로: 숫자 · 막대가 0 에서 차오르기 시작하는 시각 (초) */
export const COUNT_INTRO_DELAY_S = 0.5

/** 인트로: 숫자 · 막대가 차오르는 시간 (초). 모두 같은 순간에 끝난다 (ease-out) */
export const COUNT_INTRO_DURATION_S = 1.5
/** 팔레타이징 비전: 팔레트 격자를 가로지르는 분석 스캔 한 바퀴 시간 (재생 시각 기준, 초) */
export const PALLET_SCAN_SWEEP_S = 1.6

/** 팔레타이징 비전: 다음 적재 칸 강조가 한 번 깜빡이는 주기 (초) */
export const PALLET_TARGET_PULSE_S = 1.2


/* 공장 인트로(와이어프레임 → 면) — 진행도 t 는 0~1 (전체 시간 대비 비율) */

/** 공장 인트로 전체 길이 (초) */
export const FACTORY_INTRO_DURATION_S = 4.6

/** 와이어프레임 선: 색이 푸르게 → 하얗게 달아오른 뒤 사라지는 구간 (기존보다 빨리 풀림) */
export const FACTORY_INTRO_WIRE = {
  glowStart: 0.04,
  glowEnd: 0.26,
  hotStart: 0.16,
  hotEnd: 0.34,
  fadeStart: 0.28,
  fadeEnd: 0.58,
} as const

/** 면: 나타나는 구간과 원래 재질로 안정되는 시작 시점 (선이 걷히는 타이밍에 맞춤) */
export const FACTORY_INTRO_SURFACE = {
  appearStart: 0.2,
  appearEnd: 0.52,
  settleStart: 0.4,
} as const


/* Wireframe 보기 (우측 하단 Wireframe 버튼) */

/** 와이어프레임 전환 시간 상수 (초). 지수 감쇠라 ease-out 으로 다가가고 넘치지 않는다 */
export const WIREFRAME_FADE_TAU_S = 0.12

/** 와이어프레임 보기에서 남기는 면의 불투명도 비율 (0 = 선만, 1 = 원래 면) */
export const WIREFRAME_SURFACE_OPACITY = 0.06

/** 새로 생긴 메쉬(박스 · 팔레트)에 선을 붙이러 씬을 다시 훑는 주기 (초) */
export const WIREFRAME_RESCAN_S = 1