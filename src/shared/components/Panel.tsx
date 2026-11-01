import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface PanelProps {
  children: ReactNode
  className?: string
}

export default function Panel({ children, className }: PanelProps) {
  return (
    <section className={cn('rounded border border-border-default bg-bg-surface', className)}>
      {children}
    </section>
  )
}
