import { InstancedMesh, Mesh, Raycaster, Vector3, type Object3D } from 'three'

const raycaster = new Raycaster()

const origin = new Vector3()

const DOWN = new Vector3(0, -1, 0)

/** (x, z) 에서 fromY 아래로 처음 닿는 정적 메시 윗면 높이 (InstancedMesh, skip 하위는 제외, 없으면 null) */
export function surfaceBelow(root: Object3D, x: number, fromY: number, z: number, skip?: Object3D | null) {
  origin.set(x, fromY, z)

  raycaster.set(origin, DOWN)

  for (const hit of raycaster.intersectObject(root, true)) {
    const object = hit.object

    if (!(object instanceof Mesh) || object instanceof InstancedMesh || !object.visible) continue

    let excluded = false

    object.traverseAncestors((parent) => {
      if (parent === skip) excluded = true
    })

    if (!excluded) return hit.point.y
  }

  return null
}
