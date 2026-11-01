import type { ReactNode } from 'react'

import { useUi } from '@/shared/stores/useUiStore'
import { cn } from '@/shared/lib/cn'

import HeaderRegion from './regions/HeaderRegion'
import RailRegion from './regions/RailRegion'

interface DetailLayoutProps {
  rail: ReactNode
  header: ReactNode
  main: ReactNode
  aside: ReactNode
}

/**
 * 장비 상세 화면 분할
 * ┌──────┬─────────────────────────────────┐
 * │ rail │ header 64px                     │
 * │ 64px ├──────────────────────┬──────────┤
 * │      │ main (제목 + 3D)      │ aside 412│
 * └──────┴──────────────────────┴──────────┘
 */
export default function DetailLayout({ rail, header, main, aside }: DetailLayoutProps) {
  const { sceneExpanded } = useUi()

  return (
    <div className="grid h-screen w-screen grid-cols-[64px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)] overflow-hidden bg-bg-base text-text-primary">
      <RailRegion>{rail}</RailRegion>

      <HeaderRegion>{header}</HeaderRegion>

      <main
        className={cn(
          'grid min-h-0 min-w-0',
          sceneExpanded ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_412px] gap-5 px-6 pt-4 pb-6',
        )}
      >
        <section className="flex min-h-0 min-w-0 flex-col gap-3">{main}</section>

        {!sceneExpanded && <section className="min-h-0">{aside}</section>}
      </main>
    </div>
  )
}
