import { ProcessStageCard } from "@/features/process-flow";
import Panel from "@/shared/components/Panel";
import type { ProcessStage } from "@/shared/types";

/** 하단: 입고 · 출고 · 주문. 카드는 공정 흐름과 같은 ProcessStageCard */
export default function WarehouseKpiStrip({ kpis }: { kpis: ProcessStage[] }) {
  return (
    <Panel className="flex h-full min-h-0 flex-col p-3.5">
      <div className="flex items-center gap-3">
        <h2 className="text-title text-text-primary">입고 · 출고 · 주문</h2>

        <span className="text-caption text-text-tertiary">
          {kpis.length}항목 · 실시간
        </span>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-6 gap-3">
        {kpis.map((stage) => (
          <ProcessStageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </Panel>
  );
}
