import { useMemo } from 'react'
import { Group, type Object3D } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { findGlbNode, stripLights } from '@/shared/lib/three/glbNode'
import { centerOnFloor } from '@/shared/lib/three/modelBounds'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { SceneEquipment } from '@/shared/types'

import { RAIL_001_Y, RAIL_C_Y, RAIL_LENGTH } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

const zeroChildrenXZ = (model: Object3D) => {
  model.children.forEach((child) => child.position.set(0, child.position.y, 0))

  return model
}

const zeroChildren = (model: Object3D) => {
  model.children.forEach((child) => child.position.set(0, 0, 0))

  return centerOnFloor(model)
}

/** 곡선 경로 레일 rail_c.glb */
function RailCPath() {
  const model = useCloned(MODEL_URL.railC, (scene) => {
    const node = findGlbNode(scene, 'rail_c') ?? scene

    node.position.set(0, RAIL_C_Y, 0)

    node.quaternion.identity()

    return stripLights(node)
  })

  return <primitive object={model} />
}

/** factory.glb 안의 "rail.001" 노드 (원본 authored 변환) */
function Rail001Path() {
  const { scene } = useGLTF(FACTORY_GLB_URL)

  const model = useMemo(() => {
    const group = new Group()

    const found = findGlbNode(scene, 'rail.001')

    if (!found) return group

    const node = stripLights(found.clone(true))

    node.position.set(0, RAIL_001_Y, 0)

    node.quaternion.set(1, 0, 0, 0)

    node.scale.set(-1, -1, -1)

    group.add(node)

    return group
  }, [scene])

  return <primitive object={model} />
}

/** 입하/출하 직선 rail_in_out.glb (원본 길이 그대로) */
function RailInOut() {
  return <primitive object={useCloned(MODEL_URL.railInOut, zeroChildrenXZ)} />
}

/** 일반 직선 rail.glb: conveyorLength 가 있으면 z 로 늘인다 */
function RailStraight({ length }: { length?: number }) {
  const model = useCloned(MODEL_URL.rail, zeroChildren)

  const stretch = length ? length / RAIL_LENGTH : 1

  return (
    <group scale={[1, 1, stretch]}>
      <primitive object={model} />
    </group>
  )
}

export default function ConveyorModel({ entity }: { entity: SceneEquipment }) {
  if (entity.conveyorPath === 'rail_c') return <RailCPath />

  if (entity.conveyorPath === 'rail_001') return <Rail001Path />

  const straight = (entity.conveyorTurn ?? 'straight') === 'straight'

  if (entity.conveyorLength && straight) return <RailInOut />

  return <RailStraight length={straight ? entity.conveyorLength : undefined} />
}
