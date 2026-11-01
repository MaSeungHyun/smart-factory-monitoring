import type { ReactNode } from "react";

import HeaderRegion from "./regions/HeaderRegion";
import RailRegion from "./regions/RailRegion";

interface WarehouseLayoutProps {
  rail: ReactNode;
  header: ReactNode;
  aside: ReactNode;
  main: ReactNode;
  bottom: ReactNode;
}

/**
 * 창고 화면 분할
 * ┌──────┬────────────────────────────────────┐
 * │ rail │ header 64px                        │
 * │ 64px ├──────────┬─────────────────────────┤
 * │      │ aside440 │ main (제목 + 3D)         │
 * │      ├──────────┴─────────────────────────┤
 * │      │ bottom 184px                       │
 * └──────┴────────────────────────────────────┘
 */
export default function WarehouseLayout({
  rail,
  header,
  aside,
  main,
  bottom,
}: WarehouseLayoutProps) {
  return (
    <div className="grid h-screen w-screen grid-cols-[64px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)] overflow-hidden bg-bg-base text-text-primary">
      <RailRegion>{rail}</RailRegion>

      <HeaderRegion>{header}</HeaderRegion>

      <main className="grid min-h-0 min-w-0 grid-cols-[440px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_184px] gap-4 px-6 pt-4 pb-6">
        <section className="min-h-0 min-w-0">{aside}</section>

        <section className="relative min-h-0 min-w-0">{main}</section>

        <section className="col-span-2 min-h-0">{bottom}</section>
      </main>
    </div>
  );
}
