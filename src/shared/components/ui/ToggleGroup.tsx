import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

export function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root className={cn('flex items-center gap-2', className)} {...props} />
}

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return <ToggleGroupPrimitive.Item className={cn('cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary-on-dark', className)} {...props} />
}
