import { Bell, Check } from 'lucide-react'

import { playbackStore, type ActiveAlarm } from '@/features/playback'
import { TONE_BG } from '@/shared/constants/status'
import { useUi } from '@/shared/hooks/useUi'
import { cn } from '@/shared/lib/cn'
import { flyToEquipment } from '@/shared/lib/equipmentActions'

const clock = (at: number) => new Date(at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

/** 실시간 알림: 미확인 알람 최신 4건 (재생 데이터). 클릭 = 장비로 이동, ✓ = 확인. 헤더 벨로 여닫음 */
export default function LiveAlertPanel({ alarms }: { alarms: ActiveAlarm[] }) {
  const { alarmPanelOpen, selectedId } = useUi()

  return (
    <div
      aria-hidden={!alarmPanelOpen}
      data-alarm-panel
      className={cn(
        'flex w-[300px] flex-col gap-1 rounded border border-border-default bg-bg-surface/95 p-3 transition-[opacity,transform] duration-200',
        alarmPanelOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
    >
      <div className="mb-1 flex items-center gap-2 text-label font-semibold text-text-primary">
        <Bell size={14} />
        실시간 알림
        <span className="ml-auto rounded bg-status-error/20 px-1.5 text-[11px] text-status-error">{alarms.length}</span>
      </div>

      {alarms.length === 0 && <span className="text-caption text-text-tertiary">현재 알림 없음</span>}

      {alarms.slice(0, 4).map((alarm) => (
        <div
          key={alarm.key}
          className={cn(
            'group flex items-start gap-2 rounded px-1.5 py-1 text-caption transition-colors duration-150 hover:bg-bg-surface-2',
            selectedId === alarm.equipmentId && 'bg-primary-fill/16',
          )}
        >
          <button type="button" onClick={() => flyToEquipment(alarm.equipmentId)} className="flex min-w-0 flex-1 items-start gap-2 rounded text-left">
            <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', TONE_BG[alarm.severity])} />

            <span className="min-w-0 flex-1 text-text-primary">{alarm.message}</span>

            <span className="shrink-0 text-[11px] text-text-tertiary tabular-nums">{clock(alarm.at)}</span>
          </button>

          <button
            type="button"
            aria-label="확인"
            onClick={() => playbackStore.ack(alarm.key)}
            className="shrink-0 rounded p-0.5 text-text-tertiary opacity-60 group-hover:opacity-100 hover:text-primary-on-dark"
          >
            <Check size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
