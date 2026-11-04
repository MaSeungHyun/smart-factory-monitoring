import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

/** 정보 카드 공통 겉모양 (메인 관제 클릭 카드 스타일): 메인 · 장비 상세 · 스캔 상세 콜아웃이 같이 쓴다 */
export default function InfoCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('min-w-[200px] rounded border border-primary-on-dark bg-bg-surface/95 px-2.5 py-2 text-caption text-text-primary shadow-lg', className)}>
      {children}
    </div>
  )
}