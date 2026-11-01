import { SceneControls, SceneLegend, SceneSlot } from '@/features/scene'
import { useUi } from '@/shared/hooks/useUi'

import type { WarehouseView } from '../hooks/useWarehouse'
import LiveAlertPanel from './LiveAlertPanel'
import RackMapPanel from './RackMapPanel'
import VehicleTagOverlay from './VehicleTagOverlay'

/** 가운데: 상주 3D 창고 탑뷰 + 콜아웃 · 랙 맵 · 알림 · 범례 */
export default function WarehouseScene({ data, selected }: { data: WarehouseView | null; selected: string | null }) {
  const { labelsVisible } = useUi()

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-border-default bg-bg-base">
      <SceneSlot />

      <div className="pointer-events-none absolute inset-0">
        {data && labelsVisible && <VehicleTagOverlay vehicles={data.vehicles} selected={selected} />}

        {data && (
          <div className="absolute top-4 right-4">
            <LiveAlertPanel alarms={data.alarms} />
          </div>
        )}

        {data && (
          <div className="absolute bottom-[72px] left-4">
            <RackMapPanel grid={data.grid} loading={data.loading} />
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <SceneLegend />
        </div>

        <div className="absolute right-4 bottom-4">
          <SceneControls />
        </div>
      </div>
    </div>
  )
}
