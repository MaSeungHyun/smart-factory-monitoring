import { useMemo } from 'react'

import { dashboardView } from '../lib/dashboardView'
import { usePlayback } from './usePlayback'

/** 재생 데이터 -> 대시보드 표시값 (재생 데이터가 없으면 null) */
export function useDashboardView() {
  const { run, time, reached, origins, acked } = usePlayback()

  return useMemo(
    () => (run ? dashboardView(run, time, reached, origins, acked) : null),
    [run, time, reached, origins, acked],
  )
}
