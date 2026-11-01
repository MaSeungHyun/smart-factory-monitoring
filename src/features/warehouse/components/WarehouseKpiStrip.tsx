import Panel from '@/shared/components/Panel'

import type { WarehouseKpi } from '../lib/warehouseKpis'
import WarehouseKpiCard from './WarehouseKpiCard'

/** 하단: 입고 · 출고 · 주문 6카드 */
export default function WarehouseKpiStrip({ kpis }: { kpis: WarehouseKpi[] }) {
  return (
    <Panel className="flex h-full flex-col gap-2 p-4">
      <h2 className="text-title text-text-primary">입고 · 출고 · 주문</h2>

      <div className="grid min-h-0 flex-1 grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <WarehouseKpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </Panel>
  )
}
