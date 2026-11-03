/** smart-factory 원본 상수에서 가져온 배치 값 (m, rad) — modelPoints.generated / robotPedestal / door 등 */

/** 로봇 받침대: 팔 베이스가 놓이는 empty 이름과 팔 높이 */
export const ROBOT_PEDESTALS = {
  base: { point: 'robot_base_point', elevation: 1.1933 },
  place: { point: 'robot_arm_place_point', elevation: 1.1918 },
} as const

/** robot_base 받침대 위 팔레트 기준점 (로봇 로컬, 팔 베이스 기준) */
export const BASE_PALLET_POINT = { x: 0.0344, y: -0.971, z: -2.1951 }

/** robot_base 받침대 윗면 (로봇 로컬 XZ) — 이 안에 있는 고정 팔레트는 받침대 위에 놓인다 */
export const BASE_FOOTPRINT = { minX: -0.727, maxX: 0.674, minZ: -2.945, maxZ: 1.042 }

/** 셔틀 AMR 의 팔레트 거치 높이 (AMR_point) */
export const AMR_DECK = 1.0024

/** 팔레트 높이 / 적치장 초기 적재 수 */
export const PALLET_HEIGHT = 0.1017

export const PALLET_SOURCE_STACK = 4

/** 팔레트 기본 회전 (palletYawDegrees 90) */
export const PALLET_YAW = Math.PI / 2

/** rail.glb 직선 컨베이어 기본 길이 (beltZ 범위) */
export const RAIL_LENGTH = 26.2526

/** 경로 컨베이어 높이 */
export const RAIL_C_Y = 0.5899

export const RAIL_001_Y = 0.9577

/** ScanTunnel.glb 높이 보정: 레일 벨트 높이 + 0.003 - 터널 출구 벨트 높이 */
export const SCAN_TUNNEL_LIFT = 0.4757 + 0.5649 + 0.003 + 1.034

/** 셔터 문: 완전히 열면 높이의 절반까지 말려 올라간다 */
export const DOOR_OPEN_RATIO = 0.5

/** Transfer_Forklift_fork 휴지 y. carriage 는 (포크 y - 이 값) 만큼 오르내린다 */
export const TRANSFER_FORK_REST_Y = 1.27529

/** 레일 리프트 스토퍼 (carriage 로컬, robot_IK 와 같은 크기 m) */
export const TRANSFER_STOPPERS = {
  size: [0.08, 0.12, 1.0] as [number, number, number],
  parts: [
    { name: 'stopper-x', pos: [-0.73915, 1.03, 1.73] as [number, number, number] },
    { name: 'stopper+x', pos: [0.61915, 1.03, 1.73] as [number, number, number] },
  ],
  color: '#f59e0b',
}

/** 출하 dock 표시 */
export const DOCK = { size: 1.3, color: '#075985', opacity: 0.75, y: 0.004 }
