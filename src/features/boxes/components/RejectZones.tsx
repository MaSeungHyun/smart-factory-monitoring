import type { DecodedBox } from '../lib/decodeBoxes'

/** box.glb 높이 (원점 = 윗면) */
const BOX_HEIGHT = 0.36

/** 불량 박스를 내려놓는 리젝트 스탠드 (박스 바닥 높이에 윗면) */
export default function RejectZones({ boxes }: { boxes: DecodedBox[] }) {
  const zones = boxes.flatMap((box) => (box.reject ? [{ id: box.id, at: box.reject.at }] : []))

  return (
    <>
      {zones.map(({ id, at }) => {
        const top = Math.max(at[1] - BOX_HEIGHT, 0.2)

        return (
          <group key={id} position={[at[0], 0, at[2]]}>
            <mesh position={[0, top / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, top, 0.9]} />

              <meshStandardMaterial color='#3a3f47' metalness={0.4} roughness={0.6} />
            </mesh>

            <mesh position={[0, top + 0.005, 0]}>
              <boxGeometry args={[0.95, 0.01, 0.95]} />

              <meshStandardMaterial color='#ff3b30' emissive='#ff3b30' emissiveIntensity={0.4} />
            </mesh>

            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.75, 0.85, 4, 1, Math.PI / 4]} />

              <meshBasicMaterial color='#ffcc00' />
            </mesh>

          </group>
        )
      })}
    </>
  )
}
