import type { ReactNode } from 'react'

export default function HeaderRegion({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>
}
