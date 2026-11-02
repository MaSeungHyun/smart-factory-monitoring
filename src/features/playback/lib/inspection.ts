import type { PlaybackRun } from '@/shared/types/playback'

/** 스캐너가 박스를 불량으로 판정한 알람. 장비 고장이 아니다 */
export function isInspectionAlarm(alarm: { equipmentId: string; message: string }) {
  if (!alarm.equipmentId.startsWith('scanner-')) return false

  return alarm.message.includes('불량 감지') || alarm.message.includes('— 불량 (')
}

export function isInspectionLabel(label: string | undefined) {
  return !!label?.includes('불량 감지')
}

const reasonOf = (message: string) => message.match(/\(([^)]+)\)/)?.[1] ?? '불량'

/** 알림 문구를 박스 기준으로 바꾼다. 검사 알람이 아니면 null */
export function inspectionBoxMessage(run: PlaybackRun, alarm: { equipmentId: string; message: string; t: number }) {
  if (!isInspectionAlarm(alarm)) return null

  const box = run.boxes?.find(
    (item) => item.defect?.by === alarm.equipmentId && Math.abs(item.defect.t - alarm.t) < 8,
  )

  const reason = reasonOf(alarm.message)

  return box ? `${box.id} — 불량 (${reason})` : `박스 불량 (${reason})`
}
