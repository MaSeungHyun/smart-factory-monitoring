/** 숫자 · 진행 막대 스무딩 애니메이션 (지수 스무딩: value += (target - value) * (1 - e^(-dt / τ))) */

/** 첫 마운트 때 0 → 값으로 차오르는 시정수 τ (ms). 약 3τ(≈1초) 뒤 95% 도달, 끝으로 갈수록 감속 */
export const SMOOTH_MOUNT_TAU_MS = 330

/** 이후 값이 바뀔 때 새 목표를 따라가는 시정수 τ (ms). 다시 시작하지 않고 현재 값에서 이어진다 */
export const SMOOTH_UPDATE_TAU_MS = 250

/** 목표와 이 비율(값 범위 대비)보다 가까우면 목표에 붙이고 프레임 루프를 멈춘다 */
export const SMOOTH_SETTLE_EPSILON = 0.001

/** 탭 전환 등으로 프레임이 길게 끊겼을 때 한 번에 반영할 최대 시간 (ms) */
export const SMOOTH_MAX_FRAME_MS = 100