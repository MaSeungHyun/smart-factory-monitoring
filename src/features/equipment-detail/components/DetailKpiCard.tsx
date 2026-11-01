import type { ReactNode } from 'react'

import Card from '@/shared/components/Card'
import { cn } from '@/shared/lib/cn'

interface DetailKpiCardProps {
  icon: ReactNode
  label: string
  value: string
  unit: string
  note: string
  noteClassName?: string
  mock?: boolean
}

export default function DetailKpiCard({ icon, label, value, unit, note, noteClassName, mock }: DetailKpiCardProps) {
  return (
    <Card className="p-2.5">
      <div className="flex items-center gap-1 text-caption text-text-secondary">
        {icon}

        {label}

        <span className={cn('ml-auto text-[10px] text-text-tertiary', noteClassName)}>{note}</span>
      </div>

      <div className="mt-1 flex items-end gap-1" title={mock ? '목업 값 (재생 데이터 없음)' : undefined}>
        <span className="text-[26px] leading-tight font-bold text-text-primary tabular-nums">{value}</span>

        <span className="pb-1 text-caption text-text-tertiary">{unit}</span>
      </div>
    </Card>
  )
}
