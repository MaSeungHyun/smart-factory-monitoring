import { useImperativeHandle, useRef, type Ref } from 'react'

import type { ScreenRect } from '@/shared/lib/three/screenBounds'
import { leaderLayout } from '@/shared/lib/leaderLine'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'

import { CALLOUT_HEIGHT, CALLOUT_WIDTH, calloutPlacement } from '../lib/calloutPlacement'
import { detailKind } from '../lib/detailKind'
import { ROBOT_STATUS_COLOR } from '../lib/robotStatusColor'
import { useRobotDetail } from '../hooks/useRobotDetail'
import { useVehicleDetail } from '../hooks/useVehicleDetail'
import RobotCallout from './RobotCallout'
import VehicleCallout from './VehicleCallout'

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
  const { robotId } = useMonitorState()

  const kind = detailKind(robotId)

  const detail = useRobotDetail()

  const vehicle = useVehicleDetail()

  const fade = kind !== 'robot' && kind !== null

  const card = useRef<HTMLDivElement>(null)

  const line = useRef<SVGPolylineElement>(null)

  const dot = useRef<SVGCircleElement>(null)

  const core = useRef<SVGCircleElement>(null)

  const root = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    update(frame) {
      if (!card.current || !line.current || !dot.current || !root.current) return

      root.current.style.visibility = frame ? 'visible' : 'hidden'

      if (!frame) return

      const [width, height] = frame.size

      root.current.style.width = `${width}px`

      root.current.style.height = `${height}px`

      line.current.style.display = frame.anchor ? '' : 'none'

      dot.current.style.display = frame.anchor ? '' : 'none'

      if (core.current) core.current.style.display = frame.anchor ? '' : 'none'

      if (!frame.anchor) {
        // 기준점이 없으면 기존 배치 규칙으로 카드만 둔다
        const { x, y } = calloutPlacement(frame.rect, width, height)

        card.current.style.transform = `translate(${x}px, ${y}px)`

        return
      }

      const [ax, ay] = frame.anchor

      // 고정 상수가 아니라 실제 렌더된 카드 크기로 배치해야 선 끝과 카드 모서리가 맞는다
      const { points, cardX, cardY } = leaderLayout(ax, ay, card.current.offsetWidth || CALLOUT_WIDTH, card.current.offsetHeight || CALLOUT_HEIGHT, width)

      card.current.style.transform = `translate(${cardX}px, ${cardY}px)`

      line.current.setAttribute('points', points)

      dot.current.setAttribute('cx', String(ax))

      dot.current.setAttribute('cy', String(ay))

      core.current?.setAttribute('cx', String(ax))

      core.current?.setAttribute('cy', String(ay))
    },
  }))

  const color = (vehicle ? ROBOT_STATUS_COLOR[vehicle.status] : detail ? ROBOT_STATUS_COLOR[detail.status] : 'transparent')

  return (
    <div ref={root} data-viewport-annotation="cut" className="pointer-events-none absolute top-0 left-0" style={{ visibility: 'hidden' }}>
      <svg className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id="detail-point" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />

            <stop offset="45%" stopColor={color} stopOpacity="0.35" />

            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <polyline ref={line} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.95} />

        <circle ref={dot} r={fade ? 16 : 4} fill={fade ? 'url(#detail-point)' : color} />

        {fade && <circle ref={core} r={3.5} fill={color} />}
      </svg>

      <div ref={card} className="absolute top-0 left-0">
        {fade && vehicle ? <VehicleCallout detail={vehicle} /> : detail && <RobotCallout detail={detail} />}
      </div>
    </div>
  )
}
