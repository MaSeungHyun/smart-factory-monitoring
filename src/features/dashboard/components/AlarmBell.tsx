import { Bell } from 'lucide-react'

import { useDashboardView } from '@/features/playback'
import { useUi } from '@/shared/hooks/useUi'
import { cn } from '@/shared/lib/cn'
import { uiStore } from '@/shared/stores/uiStore'

/** 알림 패널 토글. 배지 = 확인 안 한 알람 수 */
export default function AlarmBell() {
  const view = useDashboardView()

  const { alarmPanelOpen } = useUi()

  const count = view?.alarms.length ?? 0

  return (
    <button
      type="button"
      aria-label={alarmPanelOpen ? '알림 패널 닫기' : '알림 패널 열기'}
      aria-pressed={alarmPanelOpen}
      data-alarm-bell
      onClick={uiStore.toggleAlarmPanel}
      className={cn(
        'relative ml-6 flex size-9 items-center justify-center rounded border text-text-secondary hover:text-text-primary',
        alarmPanelOpen ? 'border-primary-on-dark bg-primary-fill/16 text-text-primary' : 'border-border-default hover:border-text-tertiary',
      )}
    >
      <Bell size={16} />

      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] leading-none font-bold text-white tabular-nums">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
