import { useMemo } from 'react'

import { usePlayback } from '@/features/playback'
import { sceneEquipment } from '@/features/scene'

import { rackCellsAt, rackGrid, rackSummary } from '../lib/rackMap'
import { buildRackTimeline, rackChangesAt, rackStateAt } from '../lib/rackTimeline'

const grid = rackGrid(sceneEquipment)

/** 최근 입출고 표시 개수 */
const RECENT = 4

/** 랙 적재 현황 (재생 시각 기준). 타임라인은 런마다 한 번 계산, 시각은 이진 탐색 */
export function useRackLoad() {
  const { run, time } = usePlayback()

  const timeline = useMemo(() => (run ? buildRackTimeline(run, sceneEquipment) : null), [run])

  return useMemo(() => {
    if (!timeline) return { grid, summary: null, recent: [] }

    const state = rackStateAt(timeline, time)

    const applied = rackChangesAt(timeline, time)

    const names = new Map(grid.flat().map((cell) => [cell.id, cell.name]))

    return {
      grid: rackCellsAt(grid, state),
      summary: rackSummary(state),
      recent: timeline.changes
        .slice(Math.max(0, applied - RECENT), applied)
        .reverse()
        .map((change) => ({ ...change, rackName: names.get(change.rackId) ?? change.rackId })),
    }
  }, [timeline, time])
}

export type RackLoadView = ReturnType<typeof useRackLoad>
