import { Bell } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { playbackStore, useDashboardView } from '@/features/playback'
import { uiStore, useUi } from '@/shared/stores/useUiStore'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { cn } from '@/shared/lib/cn'
import { flyToEquipment } from '@/shared/lib/equipmentActions'

import { ALERTS } from '../data/alerts.mock'
import AlertItemRow from './AlertItemRow'

const VISIBLE = 4

/** 뷰포트 실시간 알림: 상태 칩 필터와 무관하게 미확인 알람을 즉시 표시 */
export default function AlertPanel() {
  const view = useDashboardView()

  const { alarmPanelOpen, selectedId } = useUi()

  const alarms = view?.alarms ?? null

  const activeCount = alarms ? alarms.length : ALERTS.filter((alert) => alert.severity !== 'success').length

  const prevCount = useRef(0)

  useEffect(() => {
    const count = alarms?.length ?? 0

    if (count > prevCount.current) uiStore.getState().openAlarmPanel()

    prevCount.current = count
  }, [alarms?.length])

  return (
    <aside
      aria-hidden={!alarmPanelOpen}
      data-alarm-panel
      className={cn(
        'w-full rounded border border-border-default bg-bg-surface/90 p-3.5 backdrop-blur transition-[opacity,transform] duration-200',
        alarmPanelOpen ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0',
      )}
    >
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-text-secondary" />

        <h3 className="text-body font-semibold text-text-primary">실시간 알림</h3>

        <span className="rounded bg-status-error/16 px-1.5 text-caption text-status-error tabular-nums">
          {activeCount}
        </span>

        {alarms && alarms.length > 0 && (
          <button
            type="button"
            onClick={() => playbackStore.getState().ackAll(alarms.map((alarm) => alarm.key))}
            className="ml-auto rounded px-1 text-caption text-primary-on-dark hover:underline"
          >
            모두 확인
          </button>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {alarms
          ? alarms.slice(0, VISIBLE).map((alarm) => (
              <AlertItemRow
                key={alarm.key}
                alert={{ id: alarm.key, severity: alarm.severity, message: alarm.message, time: formatClock(alarm.at, true) }}
                selected={selectedId === alarm.equipmentId}
                onOpen={() => flyToEquipment(alarm.equipmentId)}
                onAck={() => playbackStore.getState().ack(alarm.key)}
              />
            ))
          : ALERTS.map((alert) => <AlertItemRow key={alert.id} alert={alert} />)}

        {alarms && alarms.length === 0 && (
          <li className="flex h-16 items-center justify-center rounded bg-bg-surface-2 text-caption text-text-tertiary">
            확인할 알림이 없습니다
          </li>
        )}

        {alarms && alarms.length > VISIBLE && (
          <li className="text-center text-caption text-text-tertiary">외 {alarms.length - VISIBLE}건</li>
        )}
      </ul>
    </aside>
  )
}
