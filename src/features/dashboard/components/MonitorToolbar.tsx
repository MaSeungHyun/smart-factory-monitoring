import { AlertCircle, CheckCircle2, Clock, Layers } from "lucide-react";

import {
  playbackStore,
  useDashboardView,
  usePlayback,
} from "@/features/playback";
import { useUi } from "@/shared/hooks/useUi";
import { cn } from "@/shared/lib/cn";
import { uiStore, type StatusFilter } from "@/shared/stores/uiStore";

import { STATUS_COUNTS } from "../data/dashboard.mock";

export default function MonitorToolbar() {
  const view = useDashboardView();

  const { playing } = usePlayback();

  const { statusFilter } = useUi();

  const counts = view?.statusCounts ?? STATUS_COUNTS;

  const counters = [
    {
      id: "running" as StatusFilter,
      label: "작동",
      value: counts.running,
      icon: CheckCircle2,
      className: "text-status-success border-status-success/40",
    },
    {
      id: "idle" as StatusFilter,
      label: "대기",
      value: counts.idle,
      icon: Clock,
      className: "text-status-warning border-status-warning/40",
    },
    {
      id: "error" as StatusFilter,
      label: "고장",
      value: counts.error,
      icon: AlertCircle,
      className: "text-status-error border-status-error",
    },
  ];

  return (
    <div className="flex h-9 shrink-0 items-center gap-3">
      <h2 className="text-h1 text-text-primary">메인 관제</h2>

      <span className="flex h-9 w-[68px] items-center justify-center gap-1 rounded border border-border-default text-label font-medium text-text-secondary gap-1">
        <Layers size={14} />
        <span>1F</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        {counters.map(({ id, label, value, icon: Icon, className }) => (
          <button
            key={id}
            type="button"
            data-status-chip={id}
            aria-pressed={statusFilter === id}
            title={statusFilter === id ? "필터 해제" : `${label} 장비만 보기`}
            onClick={() => uiStore.toggleFilter(id)}
            className={cn(
              "flex h-8 w-[88px] items-center justify-center gap-2 rounded border text-label hover:brightness-125",
              statusFilter === id
                ? "bg-bg-surface-2 ring-1 ring-current"
                : "bg-bg-surface",
              statusFilter && statusFilter !== id && "opacity-50",
              className,
            )}
          >
            <Icon size={14} />

            <span className="text-text-secondary">{label}</span>

            <span className="font-semibold text-text-primary tabular-nums">
              {value}
            </span>
          </button>
        ))}

        <button
          type="button"
          title={playing ? "일시정지" : "재생"}
          onClick={() => playbackStore.toggle()}
          className="flex h-9 w-20 items-center justify-center gap-1 rounded bg-primary-fill text-label font-semibold text-text-primary hover:brightness-110"
        >
          <span
            className={`size-1.5 rounded-full bg-text-primary ${playing ? "animate-pulse" : "opacity-40"}`}
          />
          {playing ? "LIVE" : "PAUSE"}
        </button>
      </div>
    </div>
  );
}
