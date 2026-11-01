import { useMemo } from 'react'

import { decodeBoxes, robotWorkSpots } from '@/features/boxes'
import { usePlayback } from '@/features/playback'
import { useMonitorState } from '@/shared/hooks/useMonitorView'

/** 선택 로봇이 박스를 집는 작업 지점 (집기 기록이 없으면 null) */
export function useRobotWorkSpot() {
  const { run } = usePlayback()

  const { robotId } = useMonitorState()

  const spots = useMemo(() => (run ? robotWorkSpots(decodeBoxes(run)) : new Map()), [run])

  return spots.get(robotId) ?? null
}
