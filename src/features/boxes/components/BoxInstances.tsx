import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'

import { getExactTime } from '@/features/playback'
import { useGLTF } from '@/shared/lib/three/gltfLoader'

import boxUrl from '@/assets/models/box.glb?url'

import { boxGeometry } from '../lib/boxGeometry'
import { boxOwnerAt, boxPoseAt } from '../lib/boxPoseAt'
import { holdBoxesOnPallet, type CarryPoint } from '../lib/carryYaw'
import { createGripSync } from '../lib/gripSync'
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

  const applied = useRef(Number.NaN)

  const world = useThree((state) => state.scene)

  const gripSync = useMemo(() => createGripSync(world), [world])


  const scratch = useMemo(
    () => ({
      pose: [0, 0, 0, 0],
      matrix: new Matrix4(),
      rotation: new Quaternion(),
      position: new Vector3(),
      scale: new Vector3(1, 1, 1),
      points: [] as CarryPoint[],
      order: [] as number[],
    }),
    [],
  )

  useFrame(() => {
    const target = mesh.current

    if (!target) return

    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    const { pose, matrix, rotation, position, scale, points, order } = scratch

    let count = 0

    for (let index = 0; index < boxes.length; index++) {
      const box = boxes[index]

      if (time < box.start || time >= box.end) continue

      boxPoseAt(box, time, pose)

      const point = points[count] ?? (points[count] = { x: 0, y: 0, z: 0, yaw: 0 })

      point.x = pose[0]

      point.y = pose[1]

      point.z = pose[2]

      point.yaw = pose[3]

      order[count] = index

      count++
    }

    holdBoxesOnPallet(points, count, time)

    for (let index = 0; index < count; index++) {
      const point = points[index]

      const box = boxes[order[index]]

      position.set(point.x, point.y, point.z)

      rotation.setFromAxisAngle(UP, point.yaw)

      matrix.compose(position, rotation, scale)

      const carried = gripSync(box, time, matrix)

      target.setMatrixAt(index, matrix)

      const color = time >= box.defectAt ? DEFECT : carried || boxOwnerAt(box, time) === 'robot' ? CARRIED : NORMAL

      target.setColorAt(index, color)
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
      frustumCulled={false}
      raycast={() => null}
      onUpdate={(self) => self.setColorAt(0, NORMAL)}
    />
  )
}
