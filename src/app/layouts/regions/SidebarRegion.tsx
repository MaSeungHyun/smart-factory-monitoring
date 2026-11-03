import type { ReactNode } from 'react'

import { AnimatedPanel } from '@/shared/components/motion/AnimatedPanel'

/** 오늘 현황: 고정 너비, 내용은 내부 스크롤 */
export default function SidebarRegion({ children }: { children: ReactNode }) {
  return (
    <AnimatedPanel from="left" className="min-h-0 min-w-0">
      {children}
    </AnimatedPanel>
  )
}
