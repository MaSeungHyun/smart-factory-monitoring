import { TONE_BG } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'
import type { EquipmentStatus } from '@/shared/types'

/** 핀 가운데 점 지름 (px) */
const PIN_CORE_PX = 10

/** 점 바깥 3겹 원: 지름(px) · 불투명도. 바깥으로 갈수록 크고 옅다 */
const PIN_RINGS: ReadonlyArray<{ size: number; opacity: number }> = [
  { size: 16, opacity: 0.45 },
  { size: 22, opacity: 0.25 },
  { size: 28, opacity: 0.12 },
]

/** 핀 세로 라인 길이 (px) */
const PIN_LINE_PX = 24

/** SVG 리더선용 같은 모양 핀 (원점 = 점 중심). 바깥 원을 먼저 그리고 그 위에 가운데 점을 그린다 */
export function PinRingsSvg({ color }: { color: string }) {
  return (
    <>
      {PIN_RINGS.map(({ size, opacity }) => (
        <circle key={size} r={size / 2} fill={color} opacity={opacity} />
      ))}
    </>
  )
}

/** SVG 리더선용 가운데 점. 리더선보다 위에 그린다 */
export function PinCoreSvg({ color }: { color: string }) {
  return <circle r={PIN_CORE_PX / 2} fill={color} />
}

/** 3D 라벨 아래 핀: 상태 색 세로 라인 + 가운데 점 + 옅어지는 3겹 원. 바닥 점 중심이 앵커 위치다 */
export default function LabelPin({ tone }: { tone: EquipmentStatus }) {
  return (
    <>
      <span className={cn('w-px', TONE_BG[tone])} style={{ height: PIN_LINE_PX }} />

      <span className="relative flex items-center justify-center" style={{ width: PIN_CORE_PX, height: PIN_CORE_PX }}>
        {PIN_RINGS.map(({ size, opacity }) => (
          <span
            key={size}
            className={cn('pointer-events-none absolute rounded-full', TONE_BG[tone])}
            style={{ width: size, height: size, opacity }}
          />
        ))}

        <span className={cn('relative rounded-full', TONE_BG[tone])} style={{ width: PIN_CORE_PX, height: PIN_CORE_PX }} />
      </span>
    </>
  )
}