import type { EquipmentStatus } from './status'

export interface ProcessStage {
  id: string
  name: string
  icon: 'inbound' | 'conveyor' | 'scan' | 'pallet' | 'amr' | 'outbound'
  value: number
  unit: string
  percent: number
  status: EquipmentStatus
  statusLabel: string
}
