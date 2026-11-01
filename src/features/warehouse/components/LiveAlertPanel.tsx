import { Bell } from 'lucide-react'

import type { ActiveAlarm } from '@/features/playback'
import { TONE_BG } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

const clock = (at: number) => new Date(at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

/** 실시간 알림: 미확인 알람 최신 4건 (재생 데이터) */
export default function LiveAlertPanel({ alarms }: { alarms: ActiveAlarm[] }) {
  return (
    <div className="pointer-events-auto flex w-[300px] flex-col gap-2 rounded border border-border-default bg-bg-surface/95 p-3">
      <div className="flex items-center gap-2 text-label font-semibold text-text-primary">
        <Bell size={14} />
        실시간 알림
        <span className="ml-auto rounded bg-status-error/20 px-1.5 text-[11px] text-status-error">{alarms.length}</span>
      </div>

      {alarms.length === 0 && <span className="text-caption text-text-tertiary">현재 알림 없음</span>}

      {alarms.slice(0, 4).map((alarm) => (
        <div key={alarm.key} className="flex items-start gap-2 text-caption">
          <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', TONE_BG[alarm.severity])} />

          <span className="min-w-0 flex-1 text-text-primary">{alarm.message}</span>

          <span className="shrink-0 text-[11px] text-text-tertiary tabular-nums">{clock(alarm.at)}</span>
        </div>
      ))}
    </div>
  )
}
