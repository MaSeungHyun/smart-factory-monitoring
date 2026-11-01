import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  selected?: boolean
  /** 클릭 가능한 카드: 호버 · 포커스 스타일 + 키보드 선택 */
  interactive?: boolean
}

export default function Card({ children, className, selected, interactive, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      tabIndex={interactive ? 0 : rest.tabIndex}
      aria-selected={interactive ? Boolean(selected) : undefined}
      role={interactive ? 'option' : rest.role}
      className={cn(
        'rounded border bg-bg-surface-2 p-3',
        selected ? 'border-primary-on-dark bg-primary-fill/16' : 'border-border-default',
        interactive && 'cursor-pointer transition-colors duration-150 select-none',
        interactive && !selected && 'hover:border-text-tertiary hover:bg-bg-surface',
        className,
      )}
    >
      {children}
    </div>
  )
}
