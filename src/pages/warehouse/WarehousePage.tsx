import WarehouseLayout from '@/app/layouts/WarehouseLayout'
import { Header, IconRail } from '@/features/dashboard'
import { useWarehouse, VehiclePanel, WarehouseKpiStrip, WarehouseScene, WarehouseTitleRow } from '@/features/warehouse'
import { uiStore, useUi } from '@/shared/stores/useUiStore'

/** 04_창고AMR: 레일 창고 탭 */
export default function WarehousePage() {
  const data = useWarehouse()

  const { sceneExpanded, selectedId: selected } = useUi()

  const onSelect = (id: string) => uiStore.getState().toggleSelect(id)

  return (
    <WarehouseLayout
      rail={<IconRail />}
      header={<Header />}
      aside={<VehiclePanel vehicles={data?.vehicles ?? []} selected={selected} onSelect={onSelect} />}
      main={
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          {!sceneExpanded && (
            <WarehouseTitleRow counts={data?.counts ?? { running: 0, idle: 0, error: 0 }} />
          )}

          <WarehouseScene data={data} selected={selected} />
        </div>
      }
      bottom={<WarehouseKpiStrip kpis={data?.kpis ?? []} />}
    />
  )
}
