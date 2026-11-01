import { useImperativeHandle, useRef, type Ref } from 'react'

import type { ScreenRect } from '@/shared/lib/three/screenBounds'

import { CALLOUT_HEIGHT, CALLOUT_WIDTH, calloutPlacement } from '../lib/calloutPlacement'
import { ROBOT_STATUS_COLOR } from '../lib/robotStatusColor'
import { useRobotDetail } from '../hooks/useRobotDetail'
import RobotCallout from './RobotCallout'

export interface CalloutFrame {
  rect: ScreenRect
  anchor: [number, number] | null
  size: [number, number]
}

export interface CalloutLayout {
  update: (frame: CalloutFrame | null) => void
}

interface Props {
  ref: Ref<CalloutLayout>
}

/** 3D 뷰 위 DOM 레이어 (캔버스 픽셀 좌표): 카드 + 작업 지점 점에서 꺾인 리더선 (매 프레임 DOM 직접 갱신) */
export default function RobotCalloutOverlay({ ref }: Props) {
  const detail = useRobotDetail()

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

      // 점에서 위(또는 아래)로 꺾여 카드 옆면으로 들어가는 리더선
      line.current.setAttribute('points', inside ? `${ax},${ay} ${ax},${ey}` : `${ax},${ay} ${ax},${ey} ${ex},${ey}`)

      dot.current.setAttribute('cx', String(ax))

      dot.current.setAttribute('cy', String(ay))
    },
  }))

  const color = detail ? ROBOT_STATUS_COLOR[detail.status] : 'transparent'

  return (
    <div ref={root} className="pointer-events-none absolute top-0 left-0" style={{ visibility: 'hidden' }}>
      <svg className="absolute inset-0 size-full overflow-visible">
        <polyline ref={line} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.95} />

        <circle ref={dot} r={4} fill={color} />
      </svg>

      <div ref={card} className="absolute top-0 left-0">
        {detail && <RobotCallout detail={detail} />}
      </div>
    </div>
  )
}
