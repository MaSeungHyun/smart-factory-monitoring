import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

export const Tabs = TabsPrimitive.Root

export const TabsContent = TabsPrimitive.Content

/** 오늘 현황 탭 줄: 같은 표면 위 3칸 */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('grid h-10 shrink-0 grid-flow-col auto-cols-fr gap-1 rounded border border-border-default bg-bg-surface-2 p-1', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex cursor-pointer items-center justify-center gap-1 rounded text-label font-semibold text-text-secondary outline-none',
        'hover:bg-bg-surface hover:text-text-primary focus-visible:ring-1 focus-visible:ring-primary-on-dark',
        'data-[state=active]:bg-primary-fill data-[state=active]:text-text-primary',
        className,
      )}
      {...props}
    />
  )
}
