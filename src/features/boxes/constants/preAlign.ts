/** robot_IK ROBOT_PICKING.releaseAngularSpeed: 박스 미리 맞춤 회전 속도 (rad/s) */
export const PRE_ALIGN_ANGULAR_SPEED = Math.PI

/** robot_IK minimum-jerk 시간 보정 계수 (평균 속도 -> 최고 속도 비, 1.875) */
export const PRE_ALIGN_JERK_FACTOR = 1.875

/** robot_IK ROBOT_PICKING.releaseSeconds: 회전 최소 시간 (s) */
export const PRE_ALIGN_MIN_SECONDS = 0.15

/** 이보다 작은 차이(rad)는 돌리지 않는다 (robot_IK 1e-3 과 같음) */
export const PRE_ALIGN_EPS = 1e-3

/** hand00 이 남은 회전량의 이 비율 안에 들어오면 베이스 정렬(ALIGN_BASE)이 끝난 것으로 본다 */
export const PRE_ALIGN_BASE_SETTLED = 0.02

/** 하강(PLACE) 전에 회전을 끝내 둘 여유 시간 (s): 놓기 직전 이만큼 앞에서 반드시 목표 각에 도달 */
export const PRE_ALIGN_END_MARGIN = 1.5

/** 목표 각을 읽는 시각 = 놓기 전 이 시간 (s, 음수). 놓은 뒤 키프레임은 팔레트 이동으로 각이 바뀌므로 들고 있는 마지막 각을 쓴다 */
export const PRE_ALIGN_TARGET_PROBE = -0.5
