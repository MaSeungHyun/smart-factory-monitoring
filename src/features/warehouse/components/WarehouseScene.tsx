import { ViewportAlert } from '@/features/alerts'
import { SceneControls, SceneLegend, SceneSlot } from '@/features/scene'
import { useUi } from '@/shared/stores/useUiStore'
import { cn } from '@/shared/lib/cn'

import type { WarehouseView } from '../hooks/useWarehouse'
import RackMapPanel from './RackMapPanel'
import VehicleTagOverlay from './VehicleTagOverlay'

/** 가운데: 상주 3D 창고 탑뷰 + 콜아웃 · 랙 맵 · 알림 · 범례 */
export default function WarehouseScene({ data, selected }: { data: WarehouseView | null; selected: string | null }) {
  const { labelsVisible, sceneExpanded } = useUi()

  return (
    <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded bg-bg-base', !sceneExpanded && 'mt-2.5')}>
      <SceneSlot />

      {data && labelsVisible && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <VehicleTagOverlay vehicles={data.vehicles} selected={selected} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-30">
        <ViewportAlert />

        {data && (
          <div className="absolute bottom-[72px] left-4">
            <RackMapPanel grid={data.grid} loading={data.loading} summary={data.rack.summary} recent={data.rack.recent} />
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
