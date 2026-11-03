import type { EquipmentStatus } from './status'

export interface ProcessStage {
  id: string
  name: string
  icon: 'inbound' | 'conveyor' | 'scan' | 'pallet' | 'amr' | 'outbound' | 'order'
  value: number
  unit: string
  percent: number
  status: EquipmentStatus
  statusLabel: string
  /** KPI 스키마 키 (있으면 카드가 1Hz 샘플을 보간해 연속으로 읽는다) */
  valueKey?: string
  percentKey?: string
}
