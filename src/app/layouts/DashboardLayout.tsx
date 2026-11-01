import type { ReactNode } from 'react'

import BottomRegion from './regions/BottomRegion'
import HeaderRegion from './regions/HeaderRegion'
import MainRegion from './regions/MainRegion'
import RailRegion from './regions/RailRegion'
import SidebarRegion from './regions/SidebarRegion'

interface DashboardLayoutProps {
  rail: ReactNode
  header: ReactNode
  sidebar: ReactNode
  main: ReactNode
  bottom: ReactNode
  /** 전체 화면 오버레이 (로딩 화면 등) */
  overlay?: ReactNode
}

/**
 * 화면 분할 (h-screen, 페이지 스크롤 없음)
 * ┌──────┬──────────────────────────────┐
 * │      │ header 64px                  │
 * │ rail ├─────────┬────────────────────┤
 * │ 64px │ sidebar │ main (flex)        │
 * │      │ 440px   │                    │
 * │      ├─────────┴────────────────────┤
 * │      │ bottom 184px                 │
 * XD 1920x1080 기준 여백: 위 16 · 좌 24 · 우 24 · 아래 24, 영역 간격 16
 * └──────┴──────────────────────────────┘
 */
export default function DashboardLayout({ rail, header, sidebar, main, bottom, overlay }: DashboardLayoutProps) {
  return (
    <div className="grid h-screen w-screen grid-cols-[64px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)] overflow-hidden bg-bg-base text-text-primary">
      <RailRegion>{rail}</RailRegion>

      <HeaderRegion>{header}</HeaderRegion>

      <main className="grid min-h-0 min-w-0 grid-cols-[440px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_184px] gap-4 px-6 pt-4 pb-6">
        <SidebarRegion>{sidebar}</SidebarRegion>

        <MainRegion>{main}</MainRegion>

        <BottomRegion>{bottom}</BottomRegion>
      </main>

      {overlay}
    </div>
  )
}
