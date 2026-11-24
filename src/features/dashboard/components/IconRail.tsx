import {
  Box,
  ChartNoAxesCombined,
  Cpu,
  LayoutGrid,
  ScanLine,
  Warehouse,
} from "lucide-react";

import GraphicsSettings from "./GraphicsSettings";

import Tooltip from "@/shared/components/ui/Tooltip";
import { cn } from "@/shared/lib/cn";
import {
  useMonitorView,
  type MonitorView,
} from "@/shared/stores/useMonitorViewStore";
import { openView } from "@/shared/lib/equipmentActions";
import { dashboardDialogStore, useDashboardDialog } from "@/shared/stores/useDashboardDialogStore";

const NAV_ITEMS: { id: string; icon: typeof Box; label: string; view?: MonitorView }[] = [
  { id: "main", icon: LayoutGrid, label: "공정 상세보기", view: "main" },
  { id: "equipment", icon: Cpu, label: "작업 설비 상세보기", view: "robot" },
  { id: "scan", icon: ScanLine, label: "스캐너 상세보기", view: "scan" },
  { id: "storage", icon: Warehouse, label: "적재 현황 상세보기", view: "warehouse" },
];

export default function IconRail() {
  const current = useMonitorView();

  const { open: dashboardOpen } = useDashboardDialog();

  return (
    <nav className="flex h-full w-full flex-col items-center gap-4 border-r border-border-default bg-bg-surface pb-6">
      <img
        src="/images/logo_symbol.svg"
        alt="GRAPICAR"
        width={44}
        height={44}
        className="mt-2.5 mb-3.5 size-11"
      />

      {NAV_ITEMS.map(({ id, icon: Icon, label, view }) => (
        <Tooltip key={id} content={label} side="right">
          <button
            type="button"
            aria-label={label}
            aria-pressed={view === current && !dashboardOpen}
            onClick={() => {
              dashboardDialogStore.getState().setOpen(false)

              if (view) openView(view)
            }}
            className={cn(
              "flex size-10 items-center justify-center rounded",
              view === current && !dashboardOpen
                ? "bg-primary-fill/16 text-primary-on-dark"
                : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            <Icon size={24} />
          </button>
        </Tooltip>
      ))}

      <Tooltip content="대시보드" side="right">
        <button
          type="button"
          aria-label="대시보드"
          aria-pressed={dashboardOpen}
          onClick={() => dashboardDialogStore.getState().toggle()}
          className={cn(
            "flex size-10 items-center justify-center rounded",
            dashboardOpen
              ? "bg-primary-fill/16 text-primary-on-dark"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <ChartNoAxesCombined size={24} />
        </button>
      </Tooltip>

      <GraphicsSettings />
    </nav>
  );
}
