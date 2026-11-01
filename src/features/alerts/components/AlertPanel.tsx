import { Bell } from 'lucide-react'

import { playbackStore, useDashboardView } from '@/features/playback'
import { formatClock } from '@/shared/hooks/useTimelineRange'

import { ALERTS } from '../data/alerts.mock'
import AlertItemRow from './AlertItemRow'

const VISIBLE = 4

/** 실시간 알림: 재생 데이터의 알람은 확인(ack) 전까지 남는다 */
export default function AlertPanel() {
  const view = useDashboardView()

  const alarms = view?.alarms ?? null

  const activeCount = alarms ? alarms.length : ALERTS.filter((alert) => alert.severity !== 'success').length

  return (
    <aside className="pointer-events-auto w-[428px] rounded border border-border-default bg-bg-surface/90 p-3.5 backdrop-blur">
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-text-secondary" />

        <h3 className="text-body font-semibold text-text-primary">실시간 알림</h3>

        <span className="rounded bg-status-error/16 px-1.5 text-caption text-status-error tabular-nums">
          {activeCount}
        </span>

        {alarms && alarms.length > 0 && (
          <button
            type="button"
            onClick={() => playbackStore.ackAll(alarms.map((alarm) => alarm.key))}
            className="ml-auto text-caption text-primary-on-dark"
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
                onAck={() => playbackStore.ack(alarm.key)}
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
