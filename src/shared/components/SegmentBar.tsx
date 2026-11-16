import { useLayoutEffect, useRef, useState } from 'react'

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
 * 칸 너비와 간격을 유지하고, 컨테이너에 들어가는 칸만 표시한다.
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
  const preferredWidth = segments * segmentWidth + Math.max(0, segments - 1) * gap
  const [width, setWidth] = useState(0)
  const count = width > 0 ? Math.min(segments, Math.max(1, Math.floor((width + gap) / (segmentWidth + gap)))) : 0

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return

    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const fillClass = tone === 'primary' ? 'bg-primary-on-dark' : TONE_BG[tone]

  const paint = (value: number) => {
    const fills = root.current?.children

    if (!fills) return

    const amount = (Math.min(Math.max(value, 0), 100) / 100) * fills.length

    for (let index = 0; index < fills.length; index += 1) {
      const fill = (fills[index].firstElementChild as HTMLElement | null)

      if (fill) fill.style.transform = `scaleX(${Math.min(Math.max(amount - index, 0), 1)})`
    }
  }

  const smooth = useSmoothValue(percent, paint)
  useLayoutEffect(() => paint(smooth.current.value))

  return (
    <div ref={root} style={{ gap, height, width: preferredWidth }} className={cn('flex min-w-0 max-w-full', className)}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} style={{ width: Math.min(segmentWidth, width) }} className="relative shrink-0 overflow-hidden bg-border-default">
          <span style={{ transform: 'scaleX(0)' }} className={cn('absolute inset-0 origin-left', fillClass)} />
        </span>
      ))}
    </div>
  )
}
