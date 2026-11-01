import { useMemo } from 'react'

import { useDashboardView, usePlayback, usePlaybackPick } from '@/features/playback'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'

import { scanDetail, scanRecords } from '../lib/scanDetail'

/** 선택 스캐너의 스캔 기록 (재생 기록 전체, 시각 무관) */
export function useScanRecords() {
  const run = usePlaybackPick((snap) => snap.run)

  const { scannerId } = useMonitorState()

  return useMemo(() => (run ? scanRecords(run, scannerId) : []), [run, scannerId])
}

/** 선택 스캐너 상세 (재생 4Hz 시각 기준, 재생 데이터 없으면 null) */
export function useScanDetail() {
  const { run, time, origins } = usePlayback()

  const view = useDashboardView()

  const { scannerId } = useMonitorState()

  const records = useScanRecords()

  const origin = origins[origins.length - 1] ?? 0

  return useMemo(
    () => (run && view ? scanDetail(run, records, time, origin, view.alarms, scannerId) : null),
    [run, view, records, time, origin, scannerId],
  )
}

/** 선택 가능한 스캐너 */
export function useScannerOptions() {
  const run = usePlaybackPick((snap) => snap.run)

  return useMemo(() => run?.equipment.filter((entry) => entry.kind === 'scanner') ?? [], [run])
}
