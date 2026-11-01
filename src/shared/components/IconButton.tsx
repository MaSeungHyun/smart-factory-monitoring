import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export default function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex size-11 items-center justify-center rounded border border-border-default bg-bg-surface text-text-secondary transition-colors hover:text-text-primary',
        className,
      )}
      {...props}
    />
  )
}
