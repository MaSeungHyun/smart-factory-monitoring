/** 장비 상세 로봇 카메라 튜닝 값 (m, rad) */

/** 프레임에 담을 반경: 받침대 + 팔 작업 반경이 다 들어오도록 */
export const ROBOT_FRAME_RADIUS = 3.2

/** 화면 여유 배율: 1 이면 반경이 화면 끝에 딱 붙는다 */
export const ROBOT_FRAME_MARGIN = 1.4

/** 바라보는 높이: base 아랫면에서 팔 중간쯤 */
export const ROBOT_TARGET_HEIGHT = 1.0

/** 정면·측면 카메라 올려 보는 각도 (0 = 수평). 너무 낮으면 받침대에 가린다 */
export const ROBOT_ELEVATION = (20 * Math.PI) / 180

/** 오버레이(좌상단 칩·시점 버튼, 좌하단 비전 인셋)를 피하려고 로봇을 화면 오른쪽으로 미는 양 (프레임 반경 대비 비율) */
export const ROBOT_SHIFT_RIGHT = 0.28

/** 좌하단 인셋을 피하려고 로봇을 화면 위로 올리는 양 (프레임 반경 대비 비율) */
export const ROBOT_SHIFT_UP = 0.12

/**
 * 정면 = RobotArm.glb 원본 초기 자세에서 받침 원점 → 흡착점(RobotArm_point, 없으면 hand04)이 뻗은 수평 방향.
 * 카메라는 그 방향(팔이 작업을 향해 뻗은 쪽)에 서서 로봇을 마주본다. 원본 GLB 값이라 재생 중 팔이 움직여도 돌지 않는다.
 * 정면 기준 보정 (rad): 위 방향이 어긋나면 여기서 돌린다
 */
export const ROBOT_FRONT_YAW_OFFSET = 0

/** 초기 뻗은 방향이 90° 축에서 이 각도(rad) 안이면 축으로 스냅 (대각 구도 방지) */
export const ROBOT_REACH_SNAP = (10 * Math.PI) / 180

/**
 * 측면 = 정면에서 이만큼 돈 쪽 (rad). 팔은 높이·뻗음(로컬 Y-Z) 평면에서 굽으므로 +90° / -90° 어느 쪽이든 꺾임이 보인다.
 * 기본은 +90°, 그쪽 시선이 벽·구조물에 막히면 -90° 를 쓴다 (robotCameraPose)
 */
export const ROBOT_SIDE_TURN = Math.PI / 2

/** robot_cam 에 화각이 없을 때 쓰는 기본 화각 (deg) */
export const ROBOT_DEFAULT_FOV = 40
