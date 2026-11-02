import { useMemo } from 'react'

import { indexAt, statusAt, useDashboardView, usePlayback } from '@/features/playback'
import { sceneEquipment } from '@/features/scene'

import { rackGrid, rackTargets } from '../lib/rackMap'
import { vehicleRoster, vehiclesAt } from '../lib/vehicles'
import { warehouseKpis } from '../lib/warehouseKpis'
import { useRackLoad } from './useRackLoad'

const grid = rackGrid(sceneEquipment)

const cells = grid.flat()

const home = new Map(sceneEquipment.map((entry) => [entry.id, [entry.x, entry.z] as [number, number]]))

/** 창고 · AMR 화면 표시값 (재생 4Hz 시각 기준, 재생 데이터 없으면 null) */
export function useWarehouse() {
  const { run, time } = usePlayback()

  const view = useDashboardView()

  const rack = useRackLoad()

  const roster = useMemo(() => (run ? vehicleRoster(sceneEquipment, run) : []), [run])

  return useMemo(() => {
    if (!run || !view) return null

    const frame = statusAt(run.status, time)

    const index = indexAt(run.tracks.t, time)

    const position = (id: string) => {
      const pose = run.tracks.poses[id]?.[index]

      return pose ? ([pose[0], pose[2]] as [number, number]) : (home.get(id) ?? null)
    }

    const targets = rackTargets(cells, frame, position)

    const vehicles = vehiclesAt(run, roster, frame, time, view.alarms, (id) => targets.get(id)?.name ?? null)

    const live = vehicles.filter((vehicle) => !vehicle.mock)

    return {
      vehicles,
      counts: {
        running: live.filter((vehicle) => vehicle.tone === 'running').length,
        idle: live.filter((vehicle) => vehicle.tone === 'warning').length,
        error: live.filter((vehicle) => vehicle.tone === 'error').length,
      },
      grid: rack.grid,
      rack,
      loading: new Map([...targets].map(([id, cell]) => [cell.id, vehicles.find((vehicle) => vehicle.id === id)?.code ?? id])),
      kpis: warehouseKpis(frame?.counts, frame),
    }
  }, [run, view, roster, time, rack])
}

export type WarehouseView = NonNullable<ReturnType<typeof useWarehouse>>
