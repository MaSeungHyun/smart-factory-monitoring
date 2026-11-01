import { Box3, Vector3, type Object3D } from 'three'

/** 바운딩 박스 중심(x/z)을 원점으로, 바닥(min y)을 y=0 으로 옮긴다 */
export function centerOnFloor(model: Object3D) {
  const bounds = new Box3().setFromObject(model)

  const center = bounds.getCenter(new Vector3())

  model.position.sub(new Vector3(center.x, bounds.min.y, center.z))

  return model
}

/** 그림자 맵에는 이 모델만 넣는다 */
export function castShadows(model: Object3D) {
  model.traverse((object) => {
    object.castShadow = true
  })

  return model
}

/** 로봇 그림자를 받을 면. 그림자 맵에는 넣지 않는다 */
export function receiveShadows(model: Object3D) {
  model.traverse((object) => {
    object.castShadow = false

    object.receiveShadow = true
  })

  return model
}
