import {
  BarChart3,
  Box,
  Cpu,
  LayoutGrid,
  ScanLine,
  Warehouse,
} from "lucide-react";

import GraphicsSettings from "./GraphicsSettings";

import { cn } from "@/shared/lib/cn";
import { monitorView, useMonitorView, type MonitorView } from "@/shared/stores/useMonitorViewStore";

const NAV_ITEMS: { id: string; icon: typeof Box; view?: MonitorView }[] = [
  { id: "dashboard", icon: LayoutGrid, view: "main" },
  { id: "equipment", icon: Cpu, view: "robot" },
  { id: "scan", icon: ScanLine, view: "scan" },
  { id: "storage", icon: Warehouse, view: "warehouse" },
  { id: "report", icon: BarChart3 },
];

export default function IconRail() {
  const current = useMonitorView();

  return (
    <nav className="flex h-full w-full flex-col items-center gap-4 border-r border-border-default bg-bg-surface pb-6">
      <img
        src="/images/logo_symbol.svg"
        alt="GRAPICAR"
        width={44}
        height={44}
        className="mt-2.5 mb-3.5 size-11"
      />

      {NAV_ITEMS.map(({ id, icon: Icon, view }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === current}
          onClick={() => view && monitorView.getState().set(view)}
          className={cn(
            "flex size-10 items-center justify-center rounded",
            view === current
              ? "bg-primary-fill/16 text-primary-on-dark"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <Icon size={24} />
        </button>
      ))}

      <GraphicsSettings />
    </nav>
  );
}
