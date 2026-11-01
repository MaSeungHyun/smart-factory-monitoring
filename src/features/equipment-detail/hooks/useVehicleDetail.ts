import { useMemo } from 'react'

import { useDashboardView, usePlayback, usePlaybackPick } from '@/features/playback'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'

import { detailKind, detailOptions } from '../lib/detailKind'
import { vehicleDetail } from '../lib/vehicleDetail'

/** 선택 장비가 AMR · AGV · 지게차일 때의 상세. 로봇이면 null */
export function useVehicleDetail() {
  const { run, time, origins } = usePlayback()

  const view = useDashboardView()

  const { robotId } = useMonitorState()

  const origin = origins[origins.length - 1] ?? 0

  const kind = detailKind(robotId)

  return useMemo(() => {
    if (!run || !view || kind === null || kind === 'robot') return null

    return vehicleDetail(run, time, origin, view.alarms, robotId, kind)
  }, [run, view, time, origin, robotId, kind])
}

/** 장비 상세 선택 목록 (로봇 + 운반 장비) */
export function useDetailOptions() {
  const run = usePlaybackPick((snap) => snap.run)

  return useMemo(() => (run ? detailOptions(run) : []), [run])
}
