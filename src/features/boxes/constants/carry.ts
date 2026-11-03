/** 이벤트 시각 앞뒤로 차량 yaw 를 비교하는 간격 (s, 포즈 트랙 10 Hz 한 칸) */
export const CARRY_TURN_PROBE = 0.1

/** 이 각(rad) 넘게 도는 중에 기록된 팔레트 이벤트는 차량 포즈와 시각이 안 맞아 오프셋을 잠그지 않는다 (직전 오프셋 유지) */
export const CARRY_TURN_EPS = 0.05
