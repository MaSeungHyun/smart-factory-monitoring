import { Box3, Vector3, type Object3D } from 'three'

const bounds = new Box3()

const center = new Vector3()

/** 렌더된 오브젝트의 월드 바운딩 박스 윗면 중앙 (부모/템플릿/모델 오프셋 모두 반영) */
export function worldTopCenter(object: Object3D, out: Vector3, lift = 0) {
  object.updateWorldMatrix(true, true)

  bounds.setFromObject(object)

  if (bounds.isEmpty()) return object.getWorldPosition(out)

  bounds.getCenter(center)

  return out.set(center.x, bounds.max.y + lift, center.z)
}

