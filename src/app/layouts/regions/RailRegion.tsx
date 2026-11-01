import type { ReactNode } from 'react'

/** 왼쪽 아이콘 레일: 헤더부터 바닥까지 전체 높이 */
export default function RailRegion({ children }: { children: ReactNode }) {
  return <aside className="row-span-2 min-h-0">{children}</aside>
}
