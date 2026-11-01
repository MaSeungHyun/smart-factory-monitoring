import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

const DASHES = 24

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '')

  const r = Number.parseInt(value.slice(0, 2), 16)

  const g = Number.parseInt(value.slice(2, 4), 16)

  const b = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 중심은 진하고 가장자리는 투명. 색은 리더선과 같다 */
function fadeTexture(color: string) {
  const size = 128

  const canvas = document.createElement('canvas')

  canvas.width = size

  canvas.height = size

  const ctx = canvas.getContext('2d')

  const texture = new CanvasTexture(canvas)

  texture.colorSpace = SRGBColorSpace

  if (!ctx) return texture

  const mid = size / 2

  const paint = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid)

  paint.addColorStop(0, withAlpha(color, 0.95))

  paint.addColorStop(0.4, withAlpha(color, 0.32))

  paint.addColorStop(1, withAlpha(color, 0))

  ctx.fillStyle = paint

  ctx.fillRect(0, 0, size, size)

  texture.needsUpdate = true

  return texture
}

/** AGV · AMR 바닥 마크: 밖으로 갈수록 흐려지는 점 + 같은 색의 링 */
export default function FadeSpotMarker({ color }: { color: string }) {
  const map = useMemo(() => fadeTexture(color), [color])

  const dashes = useMemo(() => Array.from({ length: DASHES }, (_, index) => (index / DASHES) * Math.PI * 2), [])

  useEffect(() => () => map.dispose(), [map])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh renderOrder={2}>
        <circleGeometry args={[0.72, 64]} />

        <meshBasicMaterial map={map} transparent depthWrite={false} depthTest={false} />
      </mesh>

      <mesh renderOrder={2}>
        <ringGeometry args={[0.58, 0.64, 64]} />

        <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
      </mesh>

      {dashes.map((start) => (
        <mesh key={start} renderOrder={2}>
          <ringGeometry args={[0.86, 0.9, 4, 1, start, (Math.PI * 2) / DASHES / 2]} />

          <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} depthTest={false} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.005]} renderOrder={3}>
        <circleGeometry args={[0.07, 24]} />

        <meshBasicMaterial color={color} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}
