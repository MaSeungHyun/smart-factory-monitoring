import { useMemo } from 'react'

const DASHES = 24

/** 작업 지점 바닥 마커: 반투명 원 + 실선 테두리 + 점선 바깥 링 + 중앙 점 (로컬 원점 = 바닥 중심) */
export default function WorkSpotMarker({ color }: { color: string }) {
  const dashes = useMemo(() => Array.from({ length: DASHES }, (_, index) => (index / DASHES) * Math.PI * 2), [])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh renderOrder={2}>
        <circleGeometry args={[0.6, 64]} />

        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} depthTest={false} />
      </mesh>

      <mesh renderOrder={2}>
        <ringGeometry args={[0.6, 0.66, 64]} />

        <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
      </mesh>

      {dashes.map((start) => (
        <mesh key={start} renderOrder={2}>
          <ringGeometry args={[0.86, 0.9, 4, 1, start, (Math.PI * 2) / DASHES / 2]} />

          <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} depthTest={false} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.005]} renderOrder={3}>
        <circleGeometry args={[0.08, 24]} />

        <meshBasicMaterial color={color} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}
