import type { EquipmentKind } from '@/shared/types'

/* Wireframe 보기 선 색 · 불투명도 (장비 종류별) */

export type WireCategory = 'robot' | 'vehicle' | 'conveyor' | 'storage' | 'scanner' | 'building' | 'fault' | 'other'

export interface WireStyle {
  /** 선 색 */
  color: string
  /** 선 최대 불투명도 (페이드가 끝났을 때 값) */
  opacity: number
}

export const WIRE_STYLE: Record<WireCategory, WireStyle> = {
  // 로봇 팔 · 받침대: 청록
  robot: { color: '#2ee6c8', opacity: 0.2 },
  // AMR · AGV · 지게차 · 이송 지게차: 주황
  vehicle: { color: '#ff9a3c', opacity: 0.2 },
  // 컨베이어 · 레일: 파랑
  conveyor: { color: '#3d8bff', opacity: 0.2 },
  // 랙 · 창고: 회색
  storage: { color: '#9aa3ad', opacity: 0.2 },
  // 스캔 터널: 보라
  scanner: { color: '#b07cff', opacity: 0.2 },
  // 건물 · 바닥 · 문 · 도크: 아주 옅은 회색
  building: { color: '#c8ccd2', opacity: 0.05 },
  // 미확인 고장(error) 알람 장비: 빨강 (종류 색보다 우선)
  fault: { color: '#ff2b2b', opacity: 0.45 },
  // 박스 · 팔레트 등 나머지: 기존 푸른 선
  other: { color: '#4fa8d4', opacity: 0.2 },
}

/** 장비 그룹 userData.kind -> 선 분류 */
export const WIRE_KIND_CATEGORY: Partial<Record<EquipmentKind, WireCategory>> = {
  robot: 'robot',
  amr: 'vehicle',
  transfer: 'vehicle',
  conveyor: 'conveyor',
  rail: 'conveyor',
  rack: 'storage',
  scanner: 'scanner',
  door: 'building',
  dock: 'building',
  floor: 'building',
}

/** factory.glb 구조물(벽 · 바닥 · 표식)을 담은 그룹 이름 -> 건물 분류 */
export const WIRE_BUILDING_GROUP = 'factory-props'

/** 선을 그릴 모서리 각도 기준 (도). 이 각도보다 많이 꺾인 모서리만 선으로 남겨 삼각형 대각선은 그리지 않는다 */
export const WIRE_EDGE_THRESHOLD_DEG = 30

/** 움직이지 않는 분류. 장비(또는 건물)별로 선을 하나로 합쳐 그리기 호출을 줄인다 */
export const WIRE_STATIC_CATEGORIES: ReadonlySet<WireCategory> = new Set(['building', 'storage', 'scanner', 'conveyor'])