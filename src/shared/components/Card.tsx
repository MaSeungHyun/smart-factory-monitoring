import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  selected?: boolean
}

export default function Card({ children, className, selected }: CardProps) {
  return (
    <div
      className={cn(
        'rounded border bg-bg-surface-2 p-3',
        selected ? 'border-primary-on-dark bg-primary-fill/16' : 'border-border-default',
        className,
      )}
    >
      {children}
    </div>
  )
}
