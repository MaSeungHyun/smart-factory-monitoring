import { useEffect, useRef } from 'react'
import { Toaster, toast } from 'sonner'

import { useDashboardView, type ActiveAlarm } from '@/features/playback'
import { formatClock } from '@/shared/hooks/useTimelineRange'
import { uiStore, useUi } from '@/shared/stores/useUiStore'

import AlertItemRow from './AlertItemRow'

/** 토스트 표시 시간 (ms) */
const TOAST_DURATION_MS = 6000

/** 동시에 쌓여 보이는 토스트 수 */
const TOAST_VISIBLE = 3

/** 한 번에 이보다 많이 새로 뜨면 개별 토스트 대신 요약 토스트 하나로 묶는다 */
const TOAST_BATCH_MAX = 3

/** 뷰포트 우상단 여백 (px). 알림 패널 위치와 맞춘다 */
const TOAST_OFFSET = { top: 18, right: 14 }

/** 토스트 폭 (px). 알림 패널(428px, 좌우 패딩 14px) 안 카드 폭과 같게 */
const TOAST_WIDTH = 400

const SUMMARY_ID = 'alarm-summary'

function openPanel() {
  toast.dismiss()

  uiStore.getState().openAlarmPanel()
}

function AlarmToastCard({ alarm }: { alarm: ActiveAlarm }) {
  return (
    <AlertItemRow
      as="div"
      alert={{ id: alarm.key, severity: alarm.severity, message: alarm.message, time: formatClock(alarm.at, true) }}
      onOpen={openPanel}
    />
  )
}

/** 여러 건을 묶은 요약 토스트. 알람 카드와 같은 모양에 가장 심각한 등급·최신 시각을 쓴다 */
function SummaryToastCard({ alarms }: { alarms: ActiveAlarm[] }) {
  const severity = alarms.some((alarm) => alarm.severity === 'error') ? 'error' : 'warning'

  const latest = Math.max(...alarms.map((alarm) => alarm.at))

  return (
    <AlertItemRow
      as="div"
      alert={{ id: SUMMARY_ID, severity, message: `새 알림 ${alarms.length}건`, time: formatClock(latest, true) }}
      onOpen={openPanel}
    />
  )
}

/**
 * 경고·고장 알람이 새로 뜨면 패널을 강제로 열지 않고 뷰포트 우상단에 토스트로 알린다.
 * 토스트를 누르면 알림 패널이 열린다. 패널이 이미 열려 있으면 토스트는 띄우지 않는다.
 */
export default function AlarmToaster() {
  const view = useDashboardView()

  const { alarmPanelOpen } = useUi()

  const alarms = view?.alarms ?? null

  const seen = useRef(new Set<string>())

  useEffect(() => {
    if (!alarms) return

    const fresh = alarms.filter((alarm) => !seen.current.has(alarm.key))

    for (const alarm of fresh) seen.current.add(alarm.key)

    const loud = fresh.filter((alarm) => alarm.severity === 'error' || alarm.severity === 'warning')

    if (loud.length === 0 || uiStore.getState().alarmPanelOpen) return

    if (loud.length > TOAST_BATCH_MAX) {
      toast.custom(() => <SummaryToastCard alarms={loud} />, { id: SUMMARY_ID, duration: TOAST_DURATION_MS })

      return
    }

    // alarms 는 최신순 → 오래된 것부터 띄워야 최신 토스트가 맨 위에 온다
    for (const alarm of [...loud].reverse()) {
      toast.custom(() => <AlarmToastCard alarm={alarm} />, { id: alarm.key, duration: TOAST_DURATION_MS })
    }
  }, [alarms])

  // 패널이 열리면 남은 토스트는 정리
  useEffect(() => {
    if (alarmPanelOpen) toast.dismiss()
  }, [alarmPanelOpen])

  // 다른 화면으로 넘어가면 토스트도 함께 정리
  useEffect(() => () => void toast.dismiss(), [])

  return (
    <div className="viewport-toaster">
      <Toaster
        position="top-right"
        offset={TOAST_OFFSET}
        visibleToasts={TOAST_VISIBLE}
        gap={8}
        style={{ '--width': `${TOAST_WIDTH}px` } as React.CSSProperties}
        toastOptions={{ unstyled: true, className: 'pointer-events-auto w-full' }}
      />
    </div>
  )
}