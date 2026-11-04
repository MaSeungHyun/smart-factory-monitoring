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

/** 정면 기준 보정 (rad). robot_cam 방향을 90° 단위로 스냅한 정면이 어긋나면 여기서 돌린다 */
export const ROBOT_FRONT_YAW_OFFSET = 0

/** 측면 = 정면에서 90° */
export const ROBOT_SIDE_TURN = Math.PI / 2

/** robot_cam 에 화각이 없을 때 쓰는 기본 화각 (deg) */
export const ROBOT_DEFAULT_FOV = 40
