import { useRef, useState } from "react";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Gauge,
  MapPin,
  MoreHorizontal,
  Package,
} from "lucide-react";

import Card from "@/shared/components/Card";
import KpiCard from "@/shared/components/KpiCard";
import Panel from "@/shared/components/Panel";
import SegmentBar from "@/shared/components/SegmentBar";
import { useDashboardView } from "@/features/playback";
import { useScrollToSelected } from "@/shared/hooks/useScrollToSelected";
import { cn } from "@/shared/lib/cn";
import { formatNumber } from "@/shared/lib/format";
import { statusVisible, useUi } from "@/shared/stores/useUiStore";

import {
  ALARM_TOTAL,
  EQUIPMENT,
  EQUIPMENT_TOTAL,
  KPIS,
  SITE,
  THROUGHPUT,
} from "../data/dashboard.mock";
import AlarmList from "./AlarmList";
import EquipmentCard from "./EquipmentCard";
import HistoryList from "./HistoryList";

const KPI_ICONS = {
  oee: <Gauge size={14} />,
  defect: <AlertTriangle size={14} />,
  inbound: <ArrowDownToLine size={14} />,
  outbound: <ArrowUpFromLine size={14} />,
};

type TabId = "equipment" | "alarm" | "history";

export default function TodayPanel() {
  const [tab, setTab] = useState<TabId>("equipment");

  const view = useDashboardView();

  const ui = useUi();

  const list = useRef<HTMLDivElement>(null);

  useScrollToSelected(list, tab === "equipment" ? ui.selectedId : null);

  const throughput = view?.throughput ?? THROUGHPUT;

  const kpis = view?.kpis ?? KPIS;

  const equipment = (view?.equipment ?? EQUIPMENT).filter((item) =>
    statusVisible(item.status, ui),
  );

  const equipmentTotal = view?.equipmentTotal ?? EQUIPMENT_TOTAL;

  const alarmTotal = view?.alarms.length ?? ALARM_TOTAL;

  const percent = Math.min(
    100,
    Math.round((throughput.value / throughput.target) * 100),
  );

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "equipment", label: "장비", count: equipmentTotal },
    { id: "alarm", label: "알람", count: alarmTotal },
    { id: "history", label: "기록" },
  ];

  return (
    <Panel className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 py-2.5">
      {/* Title */}
      <div className="flex h-7 shrink-0 items-center justify-between">
        <span className="text-h2 text-text-primary">오늘 현황</span>

        <button
          type="button"
          className="w-8 h-8 rounded-md border border-border-default p-1 text-text-secondary hover:bg-bg-surface hover:text-text-primary flex items-center justify-center"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Site selector */}
      <button
        type="button"
        className="flex h-11 shrink-0 items-center gap-2 rounded border border-border-default bg-bg-surface-2 px-3 text-body text-text-primary"
      >
        <MapPin size={14} className="text-primary-on-dark" />

        {SITE.name}

        <span className="ml-auto rounded border border-border-default px-2 text-caption text-text-secondary">
          {SITE.floor}
        </span>

        <ChevronDown size={14} className="text-text-tertiary" />
      </button>

      {/* Throughput */}
      <Card>
        <div className="flex items-center justify-between text-caption text-text-secondary">
          <span className="flex items-center gap-1">
            <Package size={14} />
            오늘 처리량
          </span>

          <span className="tabular-nums text-text-tertiary">
            목표 {formatNumber(throughput.target)}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <p className="flex items-baseline gap-1">
            <span className="text-display text-text-primary tabular-nums">
              {formatNumber(throughput.value)}
            </span>

            <span className="text-caption text-text-tertiary">
              {throughput.unit}
            </span>
          </p>

          <span className="text-h2 text-primary-on-dark tabular-nums">
            {percent}%
          </span>
        </div>

        <SegmentBar
          percent={percent}
          tone="primary"
          segments={54}
          height={16}
          className="mt-2"
        />
      </Card>

      {/* KPI grid */}
      <div className="grid shrink-0 grid-cols-2 gap-1">
        {kpis.map((item) => (
          <KpiCard
            key={item.id}
            item={item}
            icon={KPI_ICONS[item.id as keyof typeof KPI_ICONS]}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="grid h-10 shrink-0 grid-cols-3 gap-1 rounded border border-border-default bg-bg-surface-2 p-1">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            data-tab={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center justify-center gap-1 rounded text-label font-semibold",
              tab === id
                ? "bg-primary-fill text-text-primary"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
            )}
          >
            {label}

            {count !== undefined &&
              (id === "alarm" ? (
                <span className="rounded bg-status-error/16 px-1 text-status-error tabular-nums">
                  {count}
                </span>
              ) : (
                <span className="tabular-nums">{count}</span>
              ))}
          </button>
        ))}
      </div>

      {/* 장비 · 알람 · 기록만 이 영역에서 스크롤 */}
      <div ref={list} className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {tab === "equipment" && (
          <div
            role="listbox"
            aria-label="장비 목록"
            className="flex flex-col gap-2.5"
          >
            {equipment.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                selected={item.id === ui.selectedId}
              />
            ))}

            {equipment.length === 0 && (
              <p className="py-6 text-center text-caption text-text-tertiary">
                필터에 맞는 장비가 없습니다
              </p>
            )}
          </div>
        )}

        {tab === "alarm" && <AlarmList alarms={view?.alarms ?? []} />}

        {tab === "history" && <HistoryList selectedId={ui.selectedId} />}
      </div>
    </Panel>
  );
}
