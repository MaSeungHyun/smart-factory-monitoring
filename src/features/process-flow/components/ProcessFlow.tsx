import { useDashboardView } from "@/features/playback";
import Panel from "@/shared/components/Panel";

import { PROCESS_STAGES } from "../data/process.mock";
import ProcessStageCard from "./ProcessStageCard";

export default function ProcessFlow() {
  const stages = useDashboardView()?.stages ?? PROCESS_STAGES;

  return (
    <Panel className="flex h-full min-h-0 flex-col p-3.5">
      <div className="flex items-center gap-3">
        <h2 className="text-title text-text-primary">공정 흐름</h2>

        <span className="text-caption text-text-tertiary">
          {stages.length}단계 · 실시간
        </span>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-6 gap-3">
        {stages.map((stage) => (
          <ProcessStageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </Panel>
  );
}
