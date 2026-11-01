import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh, MeshBasicMaterial } from 'three'

import { playbackStore } from '@/features/playback'

import type { InboundPoint } from '../lib/inboundPoints'

const PULSE_SECONDS = 1.4

function lastSpawn(spawns: number[], time: number) {
  let last = -Infinity

  for (const spawn of spawns) {
    if (spawn > time) break

    last = spawn
  }

  return last
}

/** 박스 입고 순간 입고 지점에 퍼지는 링 */
function InboundPulse({ point }: { point: InboundPoint }) {
  const ring = useRef<Mesh>(null)

  useFrame(() => {
    const mesh = ring.current

    if (!mesh) return

    const age = playbackStore.getExactTime() - lastSpawn(point.spawns, playbackStore.getExactTime())

    const k = age / PULSE_SECONDS

    mesh.visible = k >= 0 && k < 1

    if (!mesh.visible) return

    mesh.scale.setScalar(0.6 + k * 1.2)

    const material = mesh.material as MeshBasicMaterial

    material.opacity = 0.55 * (1 - k)
  })

  return (
    <mesh ref={ring} position={[point.x, 0.03, point.z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.55, 0.65, 48]} />

      <meshBasicMaterial color="#3fb6ff" transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export default function InboundPulses({ points }: { points: InboundPoint[] }) {
  return (
    <>
      {points.map((point) => (
        <InboundPulse key={point.src} point={point} />
      ))}
    </>
  )
}
