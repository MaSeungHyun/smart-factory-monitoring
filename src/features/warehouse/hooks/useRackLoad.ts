import { useMemo } from 'react'

import { kpiAt, kpiNumber, usePlayback } from '@/features/playback'
import { KPI_KEYS } from '@/shared/constants/kpi'
import { sceneEquipment } from '@/features/scene'

import { rackCellsAt, rackGrid, rackSummary } from '../lib/rackMap'
import { buildRackTimeline, rackChangesAt, rackStateAt } from '../lib/rackTimeline'

const grid = rackGrid(sceneEquipment)

/** v4: 적재 칸 · 전체 칸 · 점유율은 공장 기록값 (가득 찬 랙 수는 타임라인 계산 유지) */
function withKpiRack(summary: ReturnType<typeof rackSummary>, kpi: ReturnType<typeof kpiAt>) {
  const stored = kpiNumber(kpi, KPI_KEYS.rackStored)

  const slots = kpiNumber(kpi, KPI_KEYS.rackSlots)

  const occupancy = kpiNumber(kpi, KPI_KEYS.rackOccupancy)

  if (stored === undefined || slots === undefined) return summary

  return { ...summary, used: Math.round(stored), capacity: slots, percent: Math.round(occupancy ?? (slots ? (stored / slots) * 100 : 0)) }
}

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
      summary: withKpiRack(rackSummary(state), kpiAt(run?.kpi, time)),
      recent: timeline.changes
        .slice(Math.max(0, applied - RECENT), applied)
        .reverse()
        .map((change) => ({ ...change, rackName: names.get(change.rackId) ?? change.rackId })),
    }
  }, [timeline, time, run])
}

export type RackLoadView = ReturnType<typeof useRackLoad>
