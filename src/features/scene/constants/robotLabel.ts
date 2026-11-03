/** 로봇 라벨 기준 메쉬 이름: 팔을 구성하는 base 메쉬 (RobotArm.glb "base.009" → 로드 후 "base009"). 받침대 "Robot_base" 는 제외 */
export const ROBOT_LABEL_NODE = /^base\d*$/

/** 로봇 라벨: 로봇 원점(받침대 위면 팔 base 메쉬 아랫면)에서 위로 띄우는 고정 높이 (m). 팔이 움직여도 위치가 흔들리지 않는다 */
export const ROBOT_LABEL_HEIGHT = 2.0
