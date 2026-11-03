import { useRef } from 'react'

import { TONE_BG, type Tone } from '@/shared/constants/status'
import { useSmoothValue, type SmoothTarget } from '@/shared/hooks/useSmoothValue'
import { cn } from '@/shared/lib/cn'

interface SegmentBarProps {
  percent: SmoothTarget
  tone?: Tone | 'primary'
  segments?: number
  /** 칸 너비 / 간격 / 높이 (px). XD 칸은 4 · 간격 3. 높이는 화면마다 다름 */
  segmentWidth?: number
  gap?: number
  height?: number
  className?: string
}

/**
 * 고정 픽셀 칸 막대: 전체 너비 = segments × segmentWidth + (segments - 1) × gap.
 * 마지막 칸은 부분적으로 채워 연속으로 차오른다. 채움 너비는 rAF 에서 직접 쓴다
 */
export default function SegmentBar({
  percent,
  tone = 'running',
  segments = 30,
  segmentWidth = 4,
  gap = 3,
  height = 8,
  className,
}: SegmentBarProps) {
  const root = useRef<HTMLDivElement>(null)

  const fillClass = tone === 'primary' ? 'bg-primary-on-dark' : TONE_BG[tone]

  useSmoothValue(percent, (value) => {
    const fills = root.current?.children

    if (!fills) return

    const amount = (Math.min(Math.max(value, 0), 100) / 100) * segments

    for (let index = 0; index < fills.length; index += 1) {
      const fill = (fills[index].firstElementChild as HTMLElement | null)

      if (fill) fill.style.transform = `scaleX(${Math.min(Math.max(amount - index, 0), 1)})`
    }
  })

  return (
    <div ref={root} style={{ gap, height }} className={cn('flex shrink-0', className)}>
      {Array.from({ length: segments }, (_, index) => (
        <span key={index} style={{ width: segmentWidth }} className="relative shrink-0 overflow-hidden bg-border-default">
          <span style={{ transform: 'scaleX(0)' }} className={cn('absolute inset-0 origin-left', fillClass)} />
        </span>
      ))}
    </div>
  )
}