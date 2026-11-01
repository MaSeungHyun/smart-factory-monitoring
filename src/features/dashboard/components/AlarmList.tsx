import { playbackStore, type ActiveAlarm } from '@/features/playback'
import { AlertItemRow } from '@/features/alerts'
import { useUi } from '@/shared/hooks/useUi'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { flyToEquipment } from '@/shared/lib/equipmentActions'

/** 오늘 현황 · 알람 탭: 미확인 알람 전부 (클릭 = 장비로 이동, 확인 = ack) */
export default function AlarmList({ alarms }: { alarms: ActiveAlarm[] }) {
  const { selectedId } = useUi()

  if (alarms.length === 0) {
    return <p className="flex h-16 items-center justify-center rounded bg-bg-surface-2 text-caption text-text-tertiary">확인할 알림이 없습니다</p>
  }

  return (
    <ul className="flex shrink-0 flex-col gap-2">
      {alarms.map((alarm) => (
        <AlertItemRow
          key={alarm.key}
          alert={{ id: alarm.key, severity: alarm.severity, message: alarm.message, time: formatClock(alarm.at, true) }}
          selected={selectedId === alarm.equipmentId}
          onOpen={() => flyToEquipment(alarm.equipmentId)}
          onAck={() => playbackStore.ack(alarm.key)}
        />
      ))}
    </ul>
  )
}
