import { useRef, useState } from "react";

import { AnimatedItem, AnimatedList } from "@/shared/components/motion/AnimatedPanel";
import Panel from "@/shared/components/Panel";
import { useScrollToSelected } from "@/shared/hooks/useScrollToSelected";
import { statusVisible, useUi } from "@/shared/stores/useUiStore";

import type { Vehicle } from "../lib/vehicles";
import DockSection from "./DockSection";
import VehicleCard from "./VehicleCard";
import VehicleTabs, { type VehicleFilter } from "./VehicleTabs";

interface Props {
  vehicles: Vehicle[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const MATCH: Record<VehicleFilter, (vehicle: Vehicle) => boolean> = {
  all: () => true,
  vehicle: (vehicle) =>
    vehicle.category === "amr" || vehicle.category === "agv",
  forkRack: (vehicle) =>
    vehicle.category === "forklift" || vehicle.category === "rack",
};

const countOf = (vehicles: Vehicle[], category: Vehicle["category"]) =>
  vehicles.filter((vehicle) => vehicle.category === category).length;

/** 왼쪽 패널: 운반 장비 현황 (탭 · 카드 목록) + 출고 도크 */
export default function VehiclePanel({ vehicles, selected, onSelect }: Props) {
  const [filter, setFilter] = useState<VehicleFilter>("all");

  const ui = useUi();

  const list = useRef<HTMLDivElement>(null);

  useScrollToSelected(list, selected);

  const shown = vehicles.filter(
    (vehicle) => MATCH[filter](vehicle) && statusVisible(vehicle.tone, ui),
  );

  const counts = {
    all: vehicles.length,
    vehicle: vehicles.filter(MATCH.vehicle).length,
    forkRack: vehicles.filter(MATCH.forkRack).length,
  };

  const caption = `AMR ${countOf(vehicles, "amr")} · AGV ${countOf(vehicles, "agv")} · 지게차 ${countOf(vehicles, "forklift")} · 랙 ${countOf(vehicles, "rack")}`;

  return (
    <Panel className="flex h-full min-h-0 w-full flex-col gap-3 px-4 py-3.5">
      <div className="flex min-w-0 items-center">
        <span className="shrink-0 text-h2 text-text-primary">
          운반 장비 현황
        </span>

        <span className="ml-auto min-w-0 truncate text-[11px] text-text-tertiary">
          {caption}
        </span>
      </div>

      <VehicleTabs value={filter} counts={counts} onChange={setFilter} />

      <div
        ref={list}
        className="scroll-thin -mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2"
      >
        <AnimatedList className="flex flex-col gap-1">
          {shown.map((vehicle) => (
            <AnimatedItem key={vehicle.id}>
              <VehicleCard
                vehicle={vehicle}
                selected={vehicle.id === selected}
                onSelect={onSelect}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      </div>

      <DockSection />
    </Panel>
  );
}
