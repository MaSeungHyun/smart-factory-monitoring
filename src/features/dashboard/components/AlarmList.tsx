import { playbackStore, type ActiveAlarm } from '@/features/playback'
import { AlertItemRow } from '@/features/alerts'
import { useUi, type StatusFilter } from '@/shared/stores/useUiStore'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { flyToEquipment } from '@/shared/lib/equipmentActions'

/** LIVE 옆 칩 → 알람 severity 매핑 (작동 = warning 포함 비고장, 고장 = error) */
const ALARM_MATCH: Record<StatusFilter, ActiveAlarm['severity'][]> = {
  running: ['warning', 'success'],
  idle: ['success'],
  error: ['error'],
}

/** 오늘 현황 · 알람 탭: 미확인 알람 (상태 칩이 있으면 해당 severity 만). 클릭 = 장비로 이동 */
export default function AlarmList({ alarms }: { alarms: ActiveAlarm[] }) {
  const { selectedId, statusFilter } = useUi()

  const shown = statusFilter
    ? alarms.filter((alarm) => ALARM_MATCH[statusFilter].includes(alarm.severity))
    : alarms

  if (shown.length === 0) {
    return (
      <p className="flex h-16 items-center justify-center rounded bg-bg-surface-2 text-caption text-text-tertiary">
        {statusFilter ? '필터에 맞는 알림이 없습니다' : '확인할 알림이 없습니다'}
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {shown.map((alarm) => (
        <AlertItemRow
          key={alarm.key}
          alert={{ id: alarm.key, severity: alarm.severity, message: alarm.message, time: formatClock(alarm.at, true) }}
          selected={selectedId === alarm.equipmentId}
          onOpen={() => flyToEquipment(alarm.equipmentId)}
          onAck={() => playbackStore.getState().ack(alarm.key)}
        />
      ))}
    </ul>
  )
}
