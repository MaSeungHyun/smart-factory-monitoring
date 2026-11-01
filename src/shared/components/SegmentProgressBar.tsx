import { useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/cn'

/** 칸 사이 간격 / 막대 높이 (CSS px) */
const GAP = 2

const HEIGHT = 8

type Layout = { cssW: number; dpr: number; offset: number }

interface SegmentProgressBarProps {
  /** 0-100 (범위 밖은 잘림) */
  value: number
  count?: number
  /** 채워진 칸의 SVG fill 클래스 */
  fillClassName?: string
  pulse?: boolean
  /** 고정 칸 너비 (CSS px). 지정하면 막대 너비 = count × segmentWidth + (count - 1) × gap */
  segmentWidth?: number
  /** 칸 간격 / 높이 (CSS px) */
  gap?: number
  height?: number
  label?: string
  className?: string
}

/** 컨테이너 너비 / devicePixelRatio / 왼쪽 소수점 오프셋 측정 (배율 변경도 추적) */
function useDeviceLayout() {
  const ref = useRef<HTMLDivElement>(null)

  const [layout, setLayout] = useState<Layout>({ cssW: 0, dpr: 1, offset: 0 })

  useLayoutEffect(() => {
    const element = ref.current

    if (!element) return

    let media: MediaQueryList | null = null

    const measure = () => {
      const dpr = window.devicePixelRatio || 1

      const rect = element.getBoundingClientRect()

      const leftDevice = rect.left * dpr

      const offset = Math.ceil(leftDevice - 0.001) - leftDevice

      setLayout((prev) =>
        prev.cssW === rect.width && prev.dpr === dpr && Math.abs(prev.offset - offset) < 0.01
          ? prev
          : { cssW: rect.width, dpr, offset },
      )
    }

    const onDprChange = () => {
      measure()

      watchDpr()
    }

    const watchDpr = () => {
      media?.removeEventListener('change', onDprChange)

      media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)

      media.addEventListener('change', onDprChange)
    }

    measure()

    watchDpr()

    const observer = new ResizeObserver(measure)

    observer.observe(element)

    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()

      window.removeEventListener('resize', measure)

      media?.removeEventListener('change', onDprChange)
    }
  }, [])

  return { ref, layout }
}

/**
 * robot_IK SegmentedProgress 포팅: 디바이스 픽셀 단위 SVG 로 그려
 * 어떤 배율에서도 칸 너비가 정확히 같다. 남는 픽셀은 끝에 비워 둔다.
 */
export default function SegmentProgressBar({
  value,
  count = 12,
  fillClassName = 'fill-primary-on-dark',
  pulse = false,
  segmentWidth,
  gap: gapCss = GAP,
  height: heightCss = HEIGHT,
  label,
  className,
}: SegmentProgressBarProps) {
  const { ref, layout } = useDeviceLayout()

  const percent = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0

  const segments = Math.max(1, Math.floor(count))

  const filled = Math.round((percent / 100) * segments)

  const { cssW, dpr, offset } = layout

  const viewW = cssW * dpr

  const usable = Math.max(0, Math.floor(viewW - offset))

  const height = Math.max(1, Math.round(heightCss * dpr))

  let gap = Math.max(1, Math.round(gapCss * dpr))

  let cell = segmentWidth
    ? Math.max(1, Math.round(segmentWidth * dpr))
    : Math.floor((usable - gap * (segments - 1)) / segments)

  if (!segmentWidth && cell < 2 && gap > 1) {
    gap = 1

    cell = Math.floor((usable - gap * (segments - 1)) / segments)
  }

  cell = Math.max(1, cell)

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        height: heightCss,
        width: segmentWidth ? segments * segmentWidth + (segments - 1) * gapCss : undefined,
      }}
      className={cn('min-w-0 overflow-hidden', !segmentWidth && 'w-full', className)}
    >
      {cssW > 0 && (
        <svg
          width={cssW}
          height={heightCss}
          viewBox={`0 0 ${viewW} ${height}`}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          aria-hidden
          className="block"
        >
          {Array.from({ length: segments }, (_, index) => (
            <rect
              key={index}
              x={offset + index * (cell + gap)}
              y={0}
              width={cell}
              height={height}
              className={cn(
                'transition-colors',
                index < filled ? cn(fillClassName, pulse && 'animate-pulse') : 'fill-text-primary/10',
              )}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
