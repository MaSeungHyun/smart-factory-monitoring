import type { EquipmentStatus } from './status'

export interface SiteInfo {
  name: string
  floor: string
}

export interface Throughput {
  value: number
  target: number
  unit: string
}

export interface KpiItem {
  id: string
  label: string
  value: string
  unit?: string
  sub?: string
  tone?: 'default' | 'error' | 'success'
  sparkline?: number[]
}

export interface EquipmentItem {
  id: string
  name: string
  process: string
  type: 'robot' | 'amr' | 'scanner'
  status: EquipmentStatus
  statusLabel: string
  metricLeft: string
  metricRight: string
  percent: number
}

/** 장비 상태별 대수. 상단 칩의 작동 = running + idle (대기도 정상 상태) */
export interface StatusCounts {
  running: number
  idle: number
  warning: number
  error: number
}
