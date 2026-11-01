import WarehouseLayout from '@/app/layouts/WarehouseLayout'
import { Header, IconRail } from '@/features/dashboard'
import { useUi } from '@/shared/hooks/useUi'
import { uiStore } from '@/shared/stores/uiStore'
import { useWarehouse, VehiclePanel, WarehouseKpiStrip, WarehouseScene, WarehouseTitleRow } from '@/features/warehouse'

/** 04_창고AMR: 레일 창고 탭 */
export default function WarehousePage() {
  const data = useWarehouse()

  const { selectedId: selected } = useUi()

  const onSelect = (id: string) => uiStore.toggleSelect(id)

  return (
    <WarehouseLayout
      rail={<IconRail />}
      header={<Header />}
      aside={<VehiclePanel vehicles={data?.vehicles ?? []} selected={selected} onSelect={onSelect} />}
      main={
        <>
          <WarehouseTitleRow counts={data?.counts ?? { running: 0, idle: 0, error: 0 }} />

          <WarehouseScene data={data} selected={selected} />
        </>
      }
      bottom={<WarehouseKpiStrip kpis={data?.kpis ?? []} />}
    />
  )
}
