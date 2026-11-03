import { useMemo } from 'react'
import { Box3, DoubleSide, Mesh, type BufferGeometry, type Material, type MeshStandardMaterial } from 'three'

import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { SceneEquipment } from '@/shared/types'

import { DOOR_OPEN_RATIO } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'

interface Panel {
  geometry: BufferGeometry
  material: Material
  height: number
}

/** door.glb 첫 메시: 중심 정렬, 윗변에 매달고, 실내(+Z) 방향으로 회전 (doorGlb 와 동일) */
function useDoorPanel(): Panel | null {
  const { scene } = useGLTF(MODEL_URL.door)

  return useMemo(() => {
    let mesh: Mesh | undefined

    scene.traverse((node) => {
      if (!mesh && node instanceof Mesh) mesh = node
    })

    if (!mesh) return null

    const geometry = mesh.geometry.clone()

    geometry.computeBoundingBox()

    const box = geometry.boundingBox ?? new Box3()

    geometry.translate(-(box.min.x + box.max.x) / 2, -box.max.y, -(box.min.z + box.max.z) / 2)

    geometry.rotateY(Math.PI)

    const material = (mesh.material as MeshStandardMaterial).clone()

    material.side = DoubleSide

    return { geometry, material, height: box.max.y - box.min.y }
  }, [scene])
}

/** 셔터 문: doorOpen 이면 높이의 절반까지 말려 올라간 상태로 고정 표시 (애니메이션·프레임 생략) */
export default function DoorModel({ entity }: { entity: SceneEquipment }) {
  const panel = useDoorPanel()

  if (!panel) return null

  const open = entity.settings?.doorOpen === true

  const visible = open ? 1 - DOOR_OPEN_RATIO : 1

  return (
    <mesh
      name="curtain"
      geometry={panel.geometry}
      material={panel.material}
      position={[0, panel.height, 0]}
      scale={[1, visible, 1]}
    />
  )
}
