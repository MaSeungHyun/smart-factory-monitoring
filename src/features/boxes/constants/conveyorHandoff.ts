/** 이 각(rad) 이상 한 키프레임 사이에 돌면 robot_IK 가 반 바퀴 스냅한 것으로 본다 (직사각형 박스는 180° 돌아도 같은 모양) */
export const BOX_FLIP_SNAP = Math.PI * 0.75

/** 컨베이어 투입: 놓은 뒤 이 시간(s) 안에 기록 월드(컨베이어) 구간이 시작되면 컨베이어에 내려놓은 것으로 본다 */
export const CONVEYOR_HANDOFF_WINDOW = 1

/** 컨베이어 투입: 놓은 뒤 이 시간(s) 뒤의 기록 각을 컨베이어에 안착한 각으로 읽는다 (1 Hz 키프레임 한 칸 + 여유) */
export const CONVEYOR_SETTLE_PROBE = 2

/** 미리 맞춤 목표를 컨베이어 안착 각으로 바꿀 때 허용하는 최대 회전 (rad): 90° 동률 + 여유. 넘으면 공중에서 크게 돌지 않게 원래 목표를 쓴다 */
export const CONVEYOR_ALIGN_MAX_TURN = Math.PI / 2 + 0.2
