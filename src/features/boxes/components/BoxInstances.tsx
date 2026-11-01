import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'

import { playbackStore } from '@/features/playback'
import { useGLTF } from '@/shared/lib/three/gltfLoader'

import boxUrl from '@/assets/models/box.glb?url'

import { boxGeometry } from '../lib/boxGeometry'
import { boxOwnerAt, boxPoseAt } from '../lib/boxPoseAt'
import type { DecodedBox } from '../lib/decodeBoxes'

const NORMAL = new Color('#ffffff')

const DEFECT = new Color('#ff3b30')

/** 로봇이 들고 있는 박스: 살짝 밝게 */
const CARRIED = new Color('#fff3c4').multiplyScalar(1.35)

const UP = new Vector3(0, 1, 0)

/** 모든 박스를 InstancedMesh 하나로 그린다 (매 프레임 재생 시각으로 갱신) */
export default function BoxInstances({ boxes }: { boxes: DecodedBox[] }) {
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

  const scratch = useMemo(
    () => ({ pose: [0, 0, 0, 0], matrix: new Matrix4(), rotation: new Quaternion(), position: new Vector3(), scale: new Vector3(1, 1, 1) }),
    [],
  )

  useFrame(() => {
    const target = mesh.current

    if (!target) return

    const time = playbackStore.getExactTime()

    const { pose, matrix, rotation, position, scale } = scratch

    let count = 0

    for (const box of boxes) {
      if (time < box.start || time >= box.end) continue

      boxPoseAt(box, time, pose)

      position.set(pose[0], pose[1], pose[2])

      rotation.setFromAxisAngle(UP, pose[3])

      target.setMatrixAt(count, matrix.compose(position, rotation, scale))

      const color = time >= box.defectAt ? DEFECT : boxOwnerAt(box, time) === 'robot' ? CARRIED : NORMAL

      target.setColorAt(count, color)

      count++
    }

    target.count = count

    target.instanceMatrix.needsUpdate = true

    if (target.instanceColor) target.instanceColor.needsUpdate = true
  })

  const capacity = Math.max(boxes.length, 1)

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, capacity]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onUpdate={(self) => self.setColorAt(0, NORMAL)}
    />
  )
}
