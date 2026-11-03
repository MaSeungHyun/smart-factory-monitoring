import { useCallback, useRef, useState } from "react";

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

import AnimatedNumber from "@/shared/components/AnimatedNumber";
import { AnimatedItem, AnimatedList } from "@/shared/components/motion/AnimatedPanel";
import Card from "@/shared/components/Card";
import KpiCard from "@/shared/components/KpiCard";
import Panel from "@/shared/components/Panel";
import SegmentBar from "@/shared/components/SegmentBar";
import { useContinuousCount, useDashboardView, useKpiGetter } from "@/features/playback";
import { KPI_KEYS } from "@/shared/constants/kpi";
import { useScrollToSelected } from "@/shared/hooks/useScrollToSelected";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/Tabs";
import { formatNumber } from "@/shared/lib/format";
import type { StatusFrame } from "@/shared/types/playback";
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

/** 오늘 처리량 (KPI 없는 예전 녹화) = 적치 + 디팔레타이징 */
const pickHandled = (frame: StatusFrame) => frame.counts.handled;

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

  // 상태 프레임의 계단식 처리량을 재생 시각으로 보간해 매 프레임 연속으로 읽는다
  const derived = useContinuousCount(pickHandled, throughput.value);

  // KPI 녹화면 공장 기록 처리량 (팔레타이징 박스, 1Hz 샘플 보간)
  const handled = useKpiGetter(KPI_KEYS.processed, derived);

  const target = throughput.target;

  const percent = useCallback(
    () => Math.min(100, (handled() / target) * 100),
    [handled, target],
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
              <AnimatedNumber value={handled} grouped />
            </span>

            <span className="text-caption text-text-tertiary">
              {throughput.unit}
            </span>
          </p>

          <span className="text-h2 text-primary-on-dark tabular-nums">
            <AnimatedNumber value={percent} suffix="%" />
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
      <AnimatedList className="grid shrink-0 grid-cols-2 gap-1">
        {kpis.map((item) => (
          <AnimatedItem key={item.id}>
            <KpiCard
              item={item}
              icon={KPI_ICONS[item.id as keyof typeof KPI_ICONS]}
            />
          </AnimatedItem>
        ))}
      </AnimatedList>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabId)}
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <TabsList aria-label="오늘 현황 목록">
          {tabs.map(({ id, label, count }) => (
            <TabsTrigger key={id} value={id} data-tab={id}>
              {label}

              {count !== undefined &&
                (id === "alarm" ? (
                  <span className="rounded bg-status-error/16 px-1 text-status-error tabular-nums">
                    {count}
                  </span>
                ) : (
                  <span className="tabular-nums">{count}</span>
                ))}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 장비 · 알람 · 기록만 이 영역에서 스크롤 */}
        <div ref={list} className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="equipment" className="outline-none">
            <AnimatedList
              role="listbox"
              aria-label="장비 목록"
              className="flex flex-col gap-2.5"
            >
              {equipment.map((item) => (
                <AnimatedItem key={item.id}>
                  <EquipmentCard
                    item={item}
                    selected={item.id === ui.selectedId}
                  />
                </AnimatedItem>
              ))}

              {equipment.length === 0 && (
                <p className="py-6 text-center text-caption text-text-tertiary">
                  필터에 맞는 장비가 없습니다
                </p>
              )}
            </AnimatedList>
          </TabsContent>

          <TabsContent value="alarm" className="outline-none">
            <AlarmList alarms={view?.alarms ?? []} />
          </TabsContent>

          <TabsContent value="history" className="outline-none">
            <HistoryList selectedId={ui.selectedId} />
          </TabsContent>
        </div>
      </Tabs>
    </Panel>
  );
}
