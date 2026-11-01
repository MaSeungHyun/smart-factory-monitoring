import {
  BarChart3,
  Box,
  Cpu,
  LayoutGrid,
  ScanLine,
  Settings,
  Warehouse,
} from "lucide-react";

import { useMonitorView } from "@/shared/hooks/useMonitorView";
import { cn } from "@/shared/lib/cn";
import { monitorView, type MonitorView } from "@/shared/stores/monitorView";

import logo from "./../../../../public/images/logo_symbol.svg";

const NAV_ITEMS: { id: string; icon: typeof Box; view?: MonitorView }[] = [
  { id: "dashboard", icon: LayoutGrid, view: "main" },
  { id: "equipment", icon: Cpu, view: "robot" },
  { id: "scan", icon: ScanLine },
  { id: "storage", icon: Warehouse },
  { id: "report", icon: BarChart3 },
];

export default function IconRail() {
  const current = useMonitorView();

  return (
    <nav className="flex h-full w-full flex-col items-center gap-4 border-r border-border-default bg-bg-surface pb-6">
      {/* <div className="mt-3.5 mb-[18px] flex size-9 items-center justify-center rounded bg-primary-fill text-text-primary"> */}
      <img src={logo} alt="logo" width={18} height={18} />
      {/* </div> */}

      {NAV_ITEMS.map(({ id, icon: Icon, view }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === current}
          onClick={() => view && monitorView.set(view)}
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

      <button
        type="button"
        className="mt-auto flex size-10 items-center justify-center text-text-tertiary"
      >
        <Settings size={24} />
      </button>
    </nav>
  );
}
