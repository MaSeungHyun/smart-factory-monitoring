/**
 * robot_IK Rack.glb 슬롯 (src/constants/modelPoints.generated.ts RACK_MODEL.slots 와 같은 순서).
 * 랙 로컬 좌표 · 1단 = 바닥, 열 L/C/R. 스냅샷 racks[].slots 인덱스도 이 순서
 */
export const RACK_SLOTS = [
  { level: 1, column: 'L', y: 0.2472, z: 1.4445 },
  { level: 1, column: 'C', y: 0.2472, z: 0 },
  { level: 1, column: 'R', y: 0.2472, z: -1.4741 },
  { level: 2, column: 'L', y: 1.7788, z: 1.4445 },
  { level: 2, column: 'C', y: 1.7788, z: 0 },
  { level: 2, column: 'R', y: 1.7788, z: -1.4741 },
  { level: 3, column: 'L', y: 3.1924, z: 1.4445 },
  { level: 3, column: 'C', y: 3.1924, z: 0 },
  { level: 3, column: 'R', y: 3.1924, z: -1.4741 },
  { level: 4, column: 'L', y: 4.6403, z: 1.4445 },
  { level: 4, column: 'C', y: 4.6403, z: 0 },
  { level: 4, column: 'R', y: 4.6403, z: -1.4741 },
  { level: 5, column: 'L', y: 6.088, z: 1.4445 },
  { level: 5, column: 'C', y: 6.088, z: 0 },
  { level: 5, column: 'R', y: 6.088, z: -1.4741 },
] as const

export const RACK_LEVELS = 5

/** 적재 이벤트 위치 → 랙 매칭 허용 거리 (m). 이보다 멀면 이동형 랙 등으로 보고 무시 */
export const RACK_MATCH_RADIUS = 3

/** 가득 판정 적재율 % */
export const RACK_FULL = 90
