/**
 * 로봇 관절 보간 방식
 * - 'step': 마지막 기록 프레임 유지 (보간 없음, 계단처럼 움직임)
 * - 'linear': 이웃 두 샘플 사이 직선 보간. 오버슈트 없음 (기본)
 * - 'curve': Catmull-Rom 곡선. 더 둥글지만 급한 방향 전환에서 살짝 넘칠 수 있다
 */
export const JOINT_INTERPOLATION: 'step' | 'linear' | 'curve' = 'linear'

/**
 * 한 샘플 간격에서 이보다 크게(도) 바뀌면 보간하지 않고 이전 값을 유지한다.
 * 언랩이 끊긴 곳(청크 경계 등)에서 관절이 한 바퀴 휙 도는 것을 막는다
 */
export const JOINT_MAX_STEP_DEG = 180