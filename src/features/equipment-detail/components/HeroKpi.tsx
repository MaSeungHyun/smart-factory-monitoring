import { Package } from 'lucide-react'
import type { ReactNode } from 'react'

import Card from '@/shared/components/Card'
import SegmentProgressBar from '@/shared/components/SegmentProgressBar'

interface HeroKpiProps {
  count: number
  target?: number
  percent?: number
  /** 막대 값. 없으면 percent, 그것도 없으면 막대를 숨긴다 */
  bar?: number
  label?: string
  unit?: string
  icon?: ReactNode
}

export default function HeroKpi({ count, target, percent, bar = percent, label = '오늘 처리량', unit = '개', icon = <Package size={14} /> }: HeroKpiProps) {
  return (
    <Card>
      <div className="flex items-center gap-1 text-caption text-text-secondary">
        {icon}

        {label}

        {target !== undefined && <span className="ml-auto text-text-tertiary tabular-nums">목표 {target.toLocaleString('ko-KR')}</span>}
      </div>

      <div className="mt-1 flex items-end gap-1">
        <span className="text-display text-text-primary tabular-nums">{count.toLocaleString('ko-KR')}</span>

        <span className="pb-1 text-caption text-text-tertiary">{unit}</span>

        {percent !== undefined && <span className="ml-auto text-title font-semibold text-primary-on-dark tabular-nums">{percent}%</span>}
      </div>

      {bar !== undefined && <SegmentProgressBar value={bar} count={70} className="mt-3" />}
    </Card>
  )
}
