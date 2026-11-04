/** 스캔 검사 카메라 튜닝 값 (m, rad) */

/** 스캐너 로컬 기준 정면 방위: 투입 벨트가 들어오는 +z 쪽(터널 입구)에서 바라본다 */
export const SCAN_FRONT_LOCAL_YAW = 0

/** 정면 기준 보정 (rad). 입구가 반대면 Math.PI, 옆이면 ±Math.PI / 2 */
export const SCAN_FRONT_YAW_OFFSET = 0

/** 스캐너 앞으로 같이 담을 투입 벨트 길이 (m): 타깃을 입구 쪽으로 이만큼의 절반 당긴다 */
export const SCAN_LOOK_AHEAD = 3

/** 바운딩 박스 반경이 없을 때 쓰는 반경 (m) */
export const SCAN_FALLBACK_RADIUS = 3

/** 반경 하한·상한 (m): 너무 작거나 큰 박스에도 구도가 무너지지 않게 */
export const SCAN_MIN_RADIUS = 2.5

export const SCAN_MAX_RADIUS = 8

/** 화면 여유 배율 */
export const SCAN_FRAME_MARGIN = 1.4

/** 정면·측면 올려 보는 각도 */
export const SCAN_ELEVATION = (22 * Math.PI) / 180

/** 측면 = 정면에서 90° */
export const SCAN_SIDE_TURN = Math.PI / 2

/** 오버레이를 피해 화면 오른쪽 / 위로 미는 양 (반경 대비 비율) */
export const SCAN_SHIFT_RIGHT = 0.28

export const SCAN_SHIFT_UP = 0.12

/** fov 를 못 받았을 때 기본 화각 (deg) */
export const SCAN_DEFAULT_FOV = 45