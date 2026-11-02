import type { ActiveAlarm } from '@/features/playback'
import { isInspectionAlarm } from '@/features/playback/lib/inspection'
import type { EquipmentItem, EquipmentStatus } from '@/shared/types'

export interface FaultLabel {
  id: string
  text: string
  status: EquipmentStatus
}

/** 미확인 알람(장비별 최신 1건) + 배터리 경고 AMR -> 3D 라벨 */
export function faultLabels(alarms: ActiveAlarm[], equipment: EquipmentItem[]): FaultLabel[] {
  const labels = new Map<string, FaultLabel>()

  for (const alarm of alarms) {
    if (isInspectionAlarm(alarm) || labels.has(alarm.equipmentId)) continue

    labels.set(alarm.equipmentId, {
      id: alarm.equipmentId,
      text: alarm.message,
      status: alarm.severity === 'error' ? 'error' : 'warning',
    })
  }

  for (const item of equipment) {
    if (item.status !== 'warning' || labels.has(item.id)) continue

    labels.set(item.id, { id: item.id, text: `${item.name} · ${item.statusLabel}`, status: 'warning' })
  }

  return [...labels.values()]
}

/** 빨간 강조 대상: 미확인 error 알람이 있는 장비 */
export function faultedIds(alarms: ActiveAlarm[]) {
  return new Set(alarms.filter((alarm) => alarm.severity === 'error' && !isInspectionAlarm(alarm)).map((alarm) => alarm.equipmentId))
}
