import { useImperativeHandle, useRef, type Ref } from 'react'

import { CALLOUT_HEIGHT, CALLOUT_WIDTH, calloutPlacement, type CalloutLayout } from '@/features/equipment-detail'

import { useScanDetail } from '../hooks/useScanDetail'
import { VERDICT_COLOR } from '../lib/scanTone'
import ScanCallout from './ScanCallout'

interface Props {
  ref: Ref<CalloutLayout>
}

/** 3D 뷰 위 DOM 레이어: 스캔 박스 카드 + 박스 링 중심에서 꺾인 리더선 (매 프레임 DOM 직접 갱신) */
export default function ScanCalloutOverlay({ ref }: Props) {
  const detail = useScanDetail()

  const card = useRef<HTMLDivElement>(null)

  const line = useRef<SVGPolylineElement>(null)

  const dot = useRef<SVGCircleElement>(null)

  const root = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    update(frame) {
      if (!card.current || !line.current || !dot.current || !root.current) return

      root.current.style.visibility = frame ? 'visible' : 'hidden'

      if (!frame) return

      const [width, height] = frame.size

      root.current.style.width = `${width}px`

      root.current.style.height = `${height}px`

      const { x, y } = calloutPlacement(frame.rect, width, height)

      card.current.style.transform = `translate(${x}px, ${y}px)`

      line.current.style.display = frame.anchor ? '' : 'none'

      dot.current.style.display = frame.anchor ? '' : 'none'

      if (!frame.anchor) return

      const [ax, ay] = frame.anchor

      const inside = ax >= x && ax <= x + CALLOUT_WIDTH

      const ey = inside ? (ay > y ? y + CALLOUT_HEIGHT : y) : y + CALLOUT_HEIGHT / 2

      const ex = ax < x ? x : x + CALLOUT_WIDTH

      line.current.setAttribute('points', inside ? `${ax},${ay} ${ax},${ey}` : `${ax},${ay} ${ax},${ey} ${ex},${ey}`)

      dot.current.setAttribute('cx', String(ax))

      dot.current.setAttribute('cy', String(ay))
    },
  }))

  const box = detail?.current ?? null

  const color = box ? VERDICT_COLOR[box.verdict] : 'transparent'

  return (
    <div ref={root} className="pointer-events-none absolute top-0 left-0" style={{ visibility: 'hidden' }}>
      <svg className="absolute inset-0 size-full overflow-visible">
        <polyline ref={line} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.95} />

        <circle ref={dot} r={4} fill={color} />
      </svg>

      <div ref={card} className="absolute top-0 left-0">
        {box && <ScanCallout box={box} />}
      </div>
    </div>
  )
}
