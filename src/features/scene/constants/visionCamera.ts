/** 팔레트 공정 외부 비전 카메라: 팔레트/AMR 중심 위 높이 (m). 클수록 더 넓게 보인다 */
export const PALLET_CAM_HEIGHT_M = 2.9

/** 팔레트 공정 외부 비전 카메라: 팔레트 중심에서 로봇 쪽으로 눈을 당기는 거리 (m). 작은 값으로 거의 수직 탑뷰 */
export const PALLET_CAM_TOWARD_ROBOT_M = 0.15

/** 팔레트 공정 외부 비전 카메라: 로봇-팔레트 축에 수직인 옆 오프셋 (m). 과도한 사선을 피하기 위해 최소 */
export const PALLET_CAM_SIDE_M = 0.08

/** 팔레트 공정 외부 비전 카메라: 화각 (deg) */
export const PALLET_CAM_FOV_DEG = 46

/** 팔레타이징 외부 비전 카메라: plan 없을 때 쓸 시선 높이 (m). AMR 덱보다 살짝 위 */
export const PALLET_CAM_FALLBACK_LOOK_Y = 1.15

/** 비전 디버그: 패널이 실제 카메라 값을 다시 읽는 주기 (ms) */
export const VISION_DEBUG_POLL_MS = 200
