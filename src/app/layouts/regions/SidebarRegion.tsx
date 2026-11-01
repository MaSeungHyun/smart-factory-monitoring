import type { ReactNode } from 'react'

/** 오늘 현황: 고정 너비, 내용은 내부 스크롤 */
export default function SidebarRegion({ children }: { children: ReactNode }) {
  return <section className="min-h-0 min-w-0">{children}</section>
}
