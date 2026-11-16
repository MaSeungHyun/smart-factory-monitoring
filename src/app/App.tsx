import { MonitoringPage } from "@/pages/monitoring";

export default function App() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {window.location.protocol === "monitor:" && (
        <div className="window-title-bar shrink-0 border-b border-border-default bg-bg-surface">
          {/* <div className="window-title-bar__drag flex h-full min-w-0 select-none items-center gap-2 px-2">
            <img src="/images/logo_symbol.svg" alt="GRAPICAR" className="size-6 shrink-0" draggable={false} />
            <span className="truncate text-caption">Smart Factory Monitoring</span>
          </div> */}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MonitoringPage />
      </div>
    </div>
  );
}
