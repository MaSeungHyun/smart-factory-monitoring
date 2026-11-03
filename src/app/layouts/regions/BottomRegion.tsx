import type { ReactNode } from 'react'

import { AnimatedPanel } from '@/shared/components/motion/AnimatedPanel'

/** 공정 흐름: 오늘 현황 + 메인 관제 너비 전체 */
export default function BottomRegion({ children }: { children: ReactNode }) {
  return (
    <AnimatedPanel from="bottom" className="col-span-2 min-h-0 min-w-0">
      {children}
    </AnimatedPanel>
  )
}
