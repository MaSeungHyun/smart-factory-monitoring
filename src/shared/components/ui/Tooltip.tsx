import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactElement, ReactNode } from 'react'

export const TooltipProvider = TooltipPrimitive.Provider

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** title 대신 쓰는 짧은 설명 풍선 */
export default function Tooltip({ content, children, side = 'bottom' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded border border-border-default bg-bg-surface px-2 py-1 text-caption text-text-primary shadow-lg"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
