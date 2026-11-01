import { PerspectiveCamera, Quaternion, Vector3, type Object3D } from 'three'

export interface CameraPose {
  position: Vector3
  target: Vector3
  fov?: number
}

const FALLBACK_DISTANCE = 50

/**
 * GLB 카메라 노드의 월드 위치/방향(+ PerspectiveCamera 이면 fov).
 * 타깃은 시선 방향 레이가 바닥(y=0)과 만나는 점 — 위를 보면 앞쪽 50m.
 */
export function glbCameraPose(root: Object3D, name: string): CameraPose | null {
  root.updateMatrixWorld(true)

  const lower = name.toLowerCase()

  let node: Object3D | undefined

  root.traverse((object) => {
    if (!node && object.name.toLowerCase() === lower) node = object
  })

  if (!node) return null

  const position = node.getWorldPosition(new Vector3())

  const direction = new Vector3(0, 0, -1).applyQuaternion(node.getWorldQuaternion(new Quaternion()))

  const distance = direction.y < -1e-3 ? -position.y / direction.y : FALLBACK_DISTANCE

  return {
    position,
    target: position.clone().addScaledVector(direction, distance),
    fov: node instanceof PerspectiveCamera ? node.fov : undefined,
  }
}
