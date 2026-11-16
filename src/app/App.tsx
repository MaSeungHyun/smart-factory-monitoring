import { MonitoringPage } from "@/pages/monitoring";

export default function App() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {window.location.protocol === "monitor:" && (
        <div className="w-full window-title-bar shrink-0 border-b border-border-default bg-bg-surface">
          <div aria-hidden className="window-title-bar__drag h-full" />
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MonitoringPage />
      </div>
    </div>
  );
}
