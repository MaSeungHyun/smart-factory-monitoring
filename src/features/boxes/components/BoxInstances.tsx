import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three'

import { getExactTime } from '@/features/playback'
import { useGLTF } from '@/shared/lib/three/gltfLoader'

import boxUrl from '@/assets/models/box.glb?url'

import { boxGeometry } from '../lib/boxGeometry'
import { boxOwnerAt } from '../lib/boxPoseAt'
import type { BoxSync } from '../lib/boxSync'
import type { DecodedBox } from '../lib/decodeBoxes'

const NORMAL = new Color('#ffffff')

const DEFECT = new Color('#ff3b30')

/** 로봇이 들고 있는 박스: 살짝 밝게 */
const CARRIED = new Color('#fff3c4').multiplyScalar(1.35)

/** 모든 박스를 InstancedMesh 하나로 그린다 (매 프레임 재생 시각으로 갱신) */
export default function BoxInstances({ boxes, sync }: { boxes: DecodedBox[]; sync: BoxSync }) {
  const { scene } = useGLTF(boxUrl)

  const { geometry, material } = useMemo(() => {
    const merged = boxGeometry(scene)

    const base = merged.material instanceof MeshStandardMaterial ? merged.material.clone() : new MeshStandardMaterial({ color: '#c8a27a' })

    return { geometry: merged.geometry, material: base }
  }, [scene])

  useEffect(
    () => () => {
      geometry.dispose()

      material.dispose()
    },
    [geometry, material],
  )

  const mesh = useRef<InstancedMesh>(null)

  const applied = useRef(Number.NaN)

  const matrix = useMemo(() => new Matrix4(), [])

  useFrame(() => {
    const target = mesh.current

    if (!target) return

    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    const visionIds = (target.userData.visionIds ??= []) as string[]

    let count = 0

    for (const box of boxes) {
      if (time < box.start || time >= box.end) continue

      const mode = sync.world(box, time, matrix)

      visionIds[count] = box.id

      target.setMatrixAt(count, matrix)

      const color = time >= box.defectAt ? DEFECT : mode === 'arm' || boxOwnerAt(box, time) === 'robot' ? CARRIED : NORMAL

      target.setColorAt(count, color)

      count++
    }
    visionIds.length = count

    target.count = count

    target.instanceMatrix.needsUpdate = true

    if (target.instanceColor) target.instanceColor.needsUpdate = true
  })

  const capacity = Math.max(boxes.length, 1)

  return (
    <instancedMesh
      ref={mesh}
      name="factory-boxes"
      args={[geometry, material, capacity]}
      frustumCulled={false}
      raycast={() => null}
      onUpdate={(self) => self.setColorAt(0, NORMAL)}
    />
  )
}
