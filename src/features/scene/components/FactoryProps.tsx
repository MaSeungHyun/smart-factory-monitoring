import { useMemo } from 'react'
import { Group, Mesh, type Material } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { findGlbNode, stripLights } from '@/shared/lib/three/glbNode'
import { receiveShadows } from '@/shared/lib/three/modelBounds'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { TemplateProp } from '@/shared/types'

const FLOOR_MARKING = 'FloorMarking'

/** factory.glb Enviroment 의 바닥 재질 */
const GROUND = 'BG_Floor'

const GROUND_OPACITY = 0.45

const withOffset = (material: Material) => {
  const clone = material.clone()

  clone.polygonOffset = true
  clone.polygonOffsetFactor = -1
  clone.polygonOffsetUnits = -4

  return clone
}

/** 바닥(BG_Floor)만 반투명. 벽·표식은 그대로 둔다 */
function fadeGround(node: Group) {
  node.traverse((object) => {
    if (!(object instanceof Mesh)) return

    const materials = Array.isArray(object.material) ? object.material : [object.material]

    const next = materials.map((material) => {
      if (material.name !== GROUND) return material

      const clone = material.clone()

      clone.transparent = true

      clone.opacity = GROUND_OPACITY

      clone.depthWrite = false

      return clone
    })

    object.material = Array.isArray(object.material) ? next : next[0]
  })
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

  // 공장 구조물은 그림자 맵에 넣지 않고, 로봇 그림자만 받는다
  receiveShadows(node)

  if (prop.node === FLOOR_MARKING) liftFloorMarking(node)

  fadeGround(node)

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

