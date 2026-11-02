import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

export const Popover = PopoverPrimitive.Root

export const PopoverTrigger = PopoverPrimitive.Trigger

/** 바깥 클릭 · Esc 로 닫히는 떠 있는 패널 */
export function PopoverContent({ className, sideOffset = 12, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn('z-50 rounded border border-border-default bg-bg-surface p-4 shadow-lg outline-none', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
