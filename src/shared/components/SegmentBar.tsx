import { TONE_BG, type Tone } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

interface SegmentBarProps {
  percent: number
  tone?: Tone | 'primary'
  segments?: number
  /** 칸 너비 / 간격 / 높이 (px). XD 칸은 4 · 간격 3. 높이는 화면마다 다름 */
  segmentWidth?: number
  gap?: number
  height?: number
  className?: string
}

/** 고정 픽셀 칸 막대: 전체 너비 = segments × segmentWidth + (segments - 1) × gap */
export default function SegmentBar({
  percent,
  tone = 'running',
  segments = 30,
  segmentWidth = 4,
  gap = 3,
  height = 8,
  className,
}: SegmentBarProps) {
  const filled = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * segments)

  const fillClass = tone === 'primary' ? 'bg-primary-on-dark' : TONE_BG[tone]

  return (
    <div style={{ gap, height }} className={cn('flex shrink-0', className)}>
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          style={{ width: segmentWidth }}
          className={cn('shrink-0', index < filled ? fillClass : 'bg-border-default')}
        />
      ))}
    </div>
  )
}
