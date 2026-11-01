import { Package } from 'lucide-react'

import Card from '@/shared/components/Card'
import SegmentProgressBar from '@/shared/components/SegmentProgressBar'

interface HeroKpiProps {
  count: number
  target: number
  percent: number
}

export default function HeroKpi({ count, target, percent }: HeroKpiProps) {
  return (
    <Card>
      <div className="flex items-center gap-1 text-caption text-text-secondary">
        <Package size={14} />

        오늘 처리량

        <span className="ml-auto text-text-tertiary tabular-nums">목표 {target.toLocaleString('ko-KR')}</span>
      </div>

      <div className="mt-1 flex items-end gap-1">
        <span className="text-display text-text-primary tabular-nums">{count.toLocaleString('ko-KR')}</span>

        <span className="pb-1 text-caption text-text-tertiary">개</span>

        <span className="ml-auto text-title font-semibold text-primary-on-dark tabular-nums">{percent}%</span>
      </div>

      <SegmentProgressBar value={percent} count={70} className="mt-3" />
    </Card>
  )
}
