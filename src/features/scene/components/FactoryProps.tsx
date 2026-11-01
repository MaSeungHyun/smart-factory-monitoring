import { useMemo } from 'react'
import { Group, Mesh, type Material } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { findGlbNode, stripLights } from '@/shared/lib/three/glbNode'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { TemplateProp } from '@/shared/types'

const FLOOR_MARKING = 'FloorMarking'

const withOffset = (material: Material) => {
  const clone = material.clone()

  clone.polygonOffset = true
  clone.polygonOffsetFactor = -1
  clone.polygonOffsetUnits = -4

  return clone
}

/** 바닥 표시는 바닥과 겹치므로 polygonOffset 으로 z-fighting 방지 */
function liftFloorMarking(node: Group) {
  node.traverse((object) => {
    if (!(object instanceof Mesh)) return

    object.material = Array.isArray(object.material)
      ? object.material.map(withOffset)
      : withOffset(object.material)
  })
}

/** factory.glb 루트 자식 노드를 복제해 원래 위치에 (override 가 있으면 그 위치/yaw 로) 배치 */
function cloneProp(scene: Group, prop: TemplateProp) {
  const found = findGlbNode(scene, prop.node, true)

  if (!found) return null

  const node = stripLights(found.clone(true)) as Group

  if (prop.position) node.position.set(...prop.position)

  if (prop.yaw !== undefined) node.rotation.set(0, prop.yaw, 0)

  node.traverse((object) => {
    object.castShadow = true
    object.receiveShadow = true
  })

  if (prop.node === FLOOR_MARKING) liftFloorMarking(node)

  return node
}

export default function FactoryProps({ props }: { props: TemplateProp[] }) {
  const { scene } = useGLTF(FACTORY_GLB_URL)

  const nodes = useMemo(
    () => props.flatMap((prop) => cloneProp(scene as Group, prop) ?? []),
    [scene, props],
  )

  return (
    <group name="factory-props">
      {nodes.map((node) => (
        <primitive key={node.uuid} object={node} />
      ))}
    </group>
  )
}
