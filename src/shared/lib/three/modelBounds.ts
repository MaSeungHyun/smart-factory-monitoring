import { Box3, Vector3, type Object3D } from 'three'

import { markDynamicCaster, markReceiver, markStaticCaster } from './shadowLayers'

/** 바운딩 박스 중심(x/z)을 원점으로, 바닥(min y)을 y=0 으로 옮긴다 */
export function centerOnFloor(model: Object3D) {
  const bounds = new Box3().setFromObject(model)

  const center = bounds.getCenter(new Vector3())

  model.position.sub(new Vector3(center.x, bounds.min.y, center.z))

  return model
}

/** 움직이는 장비 · 화물: 움직이는 태양 그림자에 드리우고, 다른 물체의 그림자도 받는다 */
export function castShadows(model: Object3D) {
  return markDynamicCaster(model)
}

/** 가만히 있는 구조물 · 장비: 고정 그림자 조명에만 드리운다 (한 번만 그려 매 프레임 비용 없음) */
export function staticShadows(model: Object3D) {
  return markStaticCaster(model)
}

/** 그림자를 받기만 한다 (바닥 · 벽 셸 등) */
export function receiveShadows(model: Object3D) {
  return markReceiver(model)
}
