import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Box3, type BufferGeometry, type Material, type Mesh, type Object3D } from 'three'

/**
 * box.glb 메시를 한 지오메트리로 합친다.
 * robot_IK createUnitBox 와 같이 원점 = 윗면 중심 (그립 포인트).
 */
export function boxGeometry(root: Object3D) {
  root.updateWorldMatrix(true, true)

  const parts: BufferGeometry[] = []

  let material: Material | null = null

  root.traverse((node) => {
    const mesh = node as Mesh

    if (!mesh.isMesh) return

    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)

    for (const name of Object.keys(geometry.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name)
    }

    parts.push(geometry)

    material ??= Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  })

  const geometry = parts.length > 1 ? (mergeGeometries(parts) ?? parts[0]) : parts[0]

  const bounds = new Box3().setFromBufferAttribute(geometry.attributes.position as never)

  const center = bounds.getCenter(bounds.min.clone())

  geometry.translate(-center.x, -bounds.max.y, -center.z)

  return { geometry, material: material as Material | null }
}
