import type { ReactNode } from 'react'

/** 메인 관제: 남은 공간 전체 (Canvas 가 셀 크기를 따라가도록 min-h-0 / min-w-0) */
export default function MainRegion({ children }: { children: ReactNode }) {
  return <section className="relative min-h-0 min-w-0">{children}</section>
}
