import { useMemo } from 'react'

import { useDashboardView, usePlayback } from '@/features/playback'
import { useMonitorState } from '@/shared/hooks/useMonitorView'

import { robotDetail } from '../lib/robotDetail'

/** 선택 로봇 상세 (재생 데이터 없으면 null) */
export function useRobotDetail() {
  const { run, time, origins } = usePlayback()

  const view = useDashboardView()

  const { robotId } = useMonitorState()

  const origin = origins[origins.length - 1] ?? 0

  return useMemo(
    () => (run && view ? robotDetail(run, time, origin, view.alarms, robotId) : null),
    [run, view, time, origin, robotId],
  )
}

/** 선택 가능한 로봇 목록 */
export function useRobotOptions() {
  const { run } = usePlayback()

  return useMemo(() => run?.equipment.filter((entry) => entry.kind === 'robot') ?? [], [run])
}
