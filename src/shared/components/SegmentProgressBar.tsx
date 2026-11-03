import { useLayoutEffect, useRef, useState } from 'react'

import { useSmoothValue, type SmoothTarget } from '@/shared/hooks/useSmoothValue'
import { cn } from '@/shared/lib/cn'

/** 칸 사이 간격 / 막대 높이 (CSS px) */
const GAP = 2

const HEIGHT = 8

type Layout = { cssW: number; dpr: number; offset: number }

interface SegmentProgressBarProps {
  /** 0-100 (범위 밖은 잘림). 함수면 프레임마다 읽는 연속 값 */
  value: SmoothTarget
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

  const segments = Math.max(1, Math.floor(count))

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

  const fills = useRef<SVGGElement>(null)

  const last = useRef(0)

  /** 칸마다 채움 rect 너비 = 칸 너비 × 채운 비율. 마지막 칸은 부분 채움으로 연속 */
  const paint = (current: number) => {
    last.current = current

    const rects = fills.current?.children

    if (!rects) return

    const amount = (Math.min(Math.max(current, 0), 100) / 100) * segments

    for (let index = 0; index < rects.length; index += 1) {
      rects[index].setAttribute('width', String(cell * Math.min(Math.max(amount - index, 0), 1)))
    }

    ref.current?.setAttribute('aria-valuenow', String(Math.round(current)))
  }

  useSmoothValue(value, paint)

  // 크기 · 배율이 바뀌면 칸 너비가 달라지므로 마지막 값으로 다시 칠한다
  useLayoutEffect(() => paint(last.current))

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
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
            <rect key={index} x={offset + index * (cell + gap)} y={0} width={cell} height={height} className="fill-text-primary/10" />
          ))}

          <g ref={fills} className={cn(fillClassName, pulse && 'animate-pulse')}>
            {Array.from({ length: segments }, (_, index) => (
              <rect key={index} x={offset + index * (cell + gap)} y={0} width={0} height={height} />
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
